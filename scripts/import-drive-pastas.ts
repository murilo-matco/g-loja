/**
 * Importa as pastas APRENDIZES / COMPANHEIROS / MESTRES (zips do Drive)
 * como trabalhos INTERNOS (nunca públicos), agrupados por pasta de irmão.
 *
 * Uso:
 *   npx tsx scripts/import-drive-pastas.ts
 *
 * Arquivos > 12 MB são listados e pulados (limite prático do upload free).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, basename, extname } from "path";
import { execSync } from "child_process";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

const CLOUD_NAME = "dx4dgjuib";
const UPLOAD_PRESET = "gloja-anexos";
const MAX_BYTES = 12 * 1024 * 1024;

const ZIPS = [
  {
    zip: "/home/murilo.matco_superlo/Downloads/APRENDIZES-20261027T022739Z-1-001.zip",
    grau: 1 as const,
    pasta: "APRENDIZES",
  },
  {
    zip: "/home/murilo.matco_superlo/Downloads/COMPANHEIROS-20261027T022739Z-1-001.zip",
    grau: 2 as const,
    pasta: "COMPANHEIROS",
  },
  {
    zip: "/home/murilo.matco_superlo/Downloads/MESTRES-20261027T022738Z-1-001.zip",
    grau: 3 as const,
    pasta: "MESTRES",
  },
];

const OUT = "/tmp/adonhiram-drive-import";

const app = initializeApp({
  apiKey: "AIzaSyAlOeUpyn0aadTq92pF5QflqqX90hby4Kg",
  authDomain: "g-loja.firebaseapp.com",
  projectId: "g-loja",
  storageBucket: "g-loja.firebasestorage.app",
  messagingSenderId: "9506124082",
  appId: "1:9506124082:web:159f6b98efe825c5e5672b",
});
const db = getFirestore(app);

function listPersonDirs(rootPasta: string): string[] {
  const base = join(OUT, rootPasta);
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(base, d.name));
}

function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

async function uploadFile(filePath: string, folder: string): Promise<{ url: string; tipo: string; nome: string } | null> {
  const st = statSync(filePath);
  if (st.size > MAX_BYTES) {
    console.log(`  SKIP (>12MB): ${basename(filePath)} (${(st.size / 1e6).toFixed(1)} MB)`);
    return null;
  }
  const nome = basename(filePath);
  const ext = extname(nome).toLowerCase();
  const tipo =
    [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)
      ? "image"
      : ext === ".pdf"
        ? "pdf"
        : "other";

  const fd = new FormData();
  const buf = readFileSync(filePath);
  fd.append("file", new Blob([buf]), nome);
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", folder);

  // PDF como image: no free, /raw/upload costuma dar 401 na entrega.
  const resource = "image";
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resource}/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const t = await res.text();
    console.log(`  FAIL upload ${nome}: ${t.slice(0, 120)}`);
    return null;
  }
  const data = (await res.json()) as { secure_url: string };
  return { url: data.secure_url, tipo, nome };
}

async function main() {
  console.log("Extraindo zips...");
  execSync(`rm -rf "${OUT}" && mkdir -p "${OUT}"`);
  for (const z of ZIPS) {
    if (!existsSync(z.zip)) {
      console.error("Zip não encontrado:", z.zip);
      process.exit(1);
    }
    execSync(`unzip -qo "${z.zip}" -d "${OUT}"`);
    console.log(" OK", z.pasta);
  }

  const lojas = await getDocs(collection(db, "lojas"));
  if (lojas.empty) {
    console.error("Nenhuma loja no Firestore.");
    process.exit(1);
  }
  const lojaId = lojas.docs[0].id;
  console.log("Loja:", lojas.docs[0].data().nome, lojaId);

  let criados = 0;
  let midiasOk = 0;
  let pulados = 0;

  for (const z of ZIPS) {
    const pessoas = listPersonDirs(z.pasta);
    console.log(`\n=== ${z.pasta} (${pessoas.length} pastas) ===`);

    for (const pessoaDir of pessoas) {
      const nome = basename(pessoaDir).replace(/,+\s*$/, "").trim();
      const titulo = `[${z.pasta}] ${nome}`;

      // Evita duplicar se já importou
      const existing = await getDocs(
        query(
          collection(db, "trabalhos"),
          where("loja_id", "==", lojaId),
          where("titulo", "==", titulo)
        )
      );
      if (!existing.empty) {
        console.log(`  já existe: ${titulo}`);
        continue;
      }

      const files = listFilesRecursive(pessoaDir).filter((f) => {
        const e = extname(f).toLowerCase();
        return [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx", ".xlsx"].includes(e);
      });

      const midias: { url: string; tipo: string; nome: string }[] = [];
      const folder = `gloja-docs/${z.pasta.toLowerCase()}/${nome.replace(/[^\w\-]+/g, "_").slice(0, 40)}`;

      for (const f of files) {
        const up = await uploadFile(f, folder);
        if (up) {
          midias.push(up);
          midiasOk++;
        } else {
          pulados++;
        }
        // ritmo leve para não estourar rate limit
        await new Promise((r) => setTimeout(r, 200));
      }

      if (midias.length === 0) {
        console.log(`  sem mídia válida: ${nome}`);
        continue;
      }

      const capa = midias.find((m) => m.tipo === "image")?.url ?? null;
      await addDoc(collection(db, "trabalhos"), {
        loja_id: lojaId,
        entidade: "loja",
        titulo,
        descricao: `Documentação interna importada da pasta Drive ${z.pasta} — ${nome}. Acesso restrito por grau.`,
        categoria: "DOCUMENTO",
        grau_minimo: z.grau,
        publico: false,
        midias,
        capa_url: capa,
        criado_por: "Import Drive",
        criado_em: serverTimestamp(),
      });
      criados++;
      console.log(`  + ${titulo} (${midias.length} arquivos)`);
    }
  }

  console.log("\n✅ Import concluído");
  console.log(" Trabalhos criados:", criados);
  console.log(" Mídias ok:", midiasOk);
  console.log(" Pulados:", pulados);
  console.log("\nNada disso é público. Irmãos veem conforme o grau no login (Área do Irmão → Trabalhos).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
