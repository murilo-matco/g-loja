/**
 * Reenvia PDFs que estão em /raw/upload/ (bloqueados no free) como resource "image",
 * atualizando as URLs no Firestore. Fonte: /tmp/adonhiram-drive-import
 *
 *   npx tsx scripts/fix-raw-pdfs-to-image.ts
 */
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, basename, extname } from "path";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

const CLOUD_NAME = "dx4dgjuib";
const UPLOAD_PRESET = "gloja-anexos";
const ROOT = "/tmp/adonhiram-drive-import";
const MAX_BYTES = 10 * 1024 * 1024; // free image upload limit ~10MB

const app = initializeApp({
  apiKey: "AIzaSyAlOeUpyn0aadTq92pF5QflqqX90hby4Kg",
  authDomain: "g-loja.firebaseapp.com",
  projectId: "g-loja",
  storageBucket: "g-loja.firebasestorage.app",
  messagingSenderId: "9506124082",
  appId: "1:9506124082:web:159f6b98efe825c5e5672b",
});
const db = getFirestore(app);

function listFilesRecursive(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listFilesRecursive(p));
    else out.push(p);
  }
  return out;
}

function findLocalPdf(nome: string): string | null {
  const files = listFilesRecursive(ROOT).filter((f) => {
    const e = extname(f).toLowerCase();
    return e === ".pdf" && basename(f).toLowerCase() === nome.toLowerCase();
  });
  if (files.length) return files[0];
  // fallback: nome curto DOS (CLAUDI~1.PDF)
  const base = nome.replace(/~\d+/i, "").replace(/\.pdf$/i, "").toLowerCase();
  const loose = listFilesRecursive(ROOT).filter((f) => {
    if (extname(f).toLowerCase() !== ".pdf") return false;
    return basename(f).toLowerCase().includes(base.slice(0, 6));
  });
  return loose[0] ?? null;
}

async function uploadAsImage(filePath: string, folder: string): Promise<string | null> {
  const st = statSync(filePath);
  if (st.size > MAX_BYTES) {
    console.log(`  SKIP size ${(st.size / 1e6).toFixed(1)}MB`, basename(filePath));
    return null;
  }
  const fd = new FormData();
  fd.append("file", new Blob([readFileSync(filePath)]), basename(filePath));
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    console.log(`  FAIL`, basename(filePath), (await res.text()).slice(0, 120));
    return null;
  }
  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}

async function main() {
  if (!existsSync(ROOT)) {
    console.error("Pasta local não encontrada:", ROOT);
    process.exit(1);
  }

  const snap = await getDocs(collection(db, "trabalhos"));
  let fixed = 0;
  let skipped = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const midias = Array.isArray(data.midias) ? [...data.midias] : [];
    let changed = false;

    for (let i = 0; i < midias.length; i++) {
      const m = midias[i] as { url: string; tipo: string; nome: string };
      if (!m?.url?.includes("/raw/upload/")) continue;
      if (m.tipo !== "pdf" && !/\.pdf/i.test(m.nome || m.url)) continue;

      const local = findLocalPdf(m.nome || basename(m.url));
      if (!local) {
        console.log(`  sem arquivo local: ${m.nome}`);
        skipped++;
        continue;
      }

      const folder = `gloja-docs/fixed/${d.id.slice(0, 8)}`;
      console.log(`  reupload ${m.nome}`);
      const url = await uploadAsImage(local, folder);
      if (!url) {
        skipped++;
        continue;
      }
      midias[i] = { ...m, url, tipo: "pdf" };
      changed = true;
      fixed++;
      await new Promise((r) => setTimeout(r, 250));
    }

    if (changed) {
      await updateDoc(doc(db, "trabalhos", d.id), { midias });
      console.log("OK", data.titulo?.slice(0, 60));
    }
  }

  console.log("\nCorrigidos:", fixed, "| Pulados:", skipped);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
