import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { compressImage, isImage } from "@/lib/image-compress";
import { getLojaId } from "@/lib/auth-store";

export interface Anexo {
  id: string;
  transacaoId: string;
  nome: string;
  url: string;
  tipo: "image" | "pdf" | "other";
  criadoEm: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tsToString(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "string") return ts;
  if (ts.toDate) return ts.toDate().toISOString();
  return new Date().toISOString();
}

function detectTipo(file: File): "image" | "pdf" | "other" {
  if (isImage(file)) return "image";
  if (file.type === "application/pdf") return "pdf";
  return "other";
}

const CLOUDINARY_CLOUD_NAME = "dx4dgjuib";
const CLOUDINARY_UPLOAD_PRESET = "gloja-anexos";

async function uploadToCloudinary(blob: Blob, fileName: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", blob, fileName);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  fd.append("folder", "gloja-anexos");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload falhou: ${err}`);
  }

  const data = await res.json();
  return data.secure_url as string;
}

// ─── Public API ─────────────────────────────────────────────

export async function getAnexos(transacaoId: string): Promise<Anexo[]> {
  const q = query(
    collection(db, "anexos"),
    where("transacao_id", "==", transacaoId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      transacaoId: data.transacao_id,
      nome: data.nome,
      url: data.url,
      tipo: data.tipo,
      criadoEm: tsToString(data.criado_em),
    };
  }).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function getAnexosMulti(transacaoIds: string[]): Promise<Record<string, Anexo[]>> {
  if (transacaoIds.length === 0) return {};

  const map: Record<string, Anexo[]> = {};
  const batchSize = 30;
  for (let i = 0; i < transacaoIds.length; i += batchSize) {
    const batch = transacaoIds.slice(i, i + batchSize);
    const q = query(
      collection(db, "anexos"),
      where("transacao_id", "in", batch)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data();
      const a: Anexo = {
        id: d.id,
        transacaoId: data.transacao_id,
        nome: data.nome,
        url: data.url,
        tipo: data.tipo,
        criadoEm: tsToString(data.criado_em),
      };
      if (!map[a.transacaoId]) map[a.transacaoId] = [];
      map[a.transacaoId].push(a);
    }
  }
  return map;
}

export async function uploadAnexo(transacaoId: string, file: File): Promise<Anexo> {
  const lojaId = getLojaId();
  if (!lojaId) throw new Error("Sessão inválida.");

  const tipo = detectTipo(file);
  const blob = tipo === "image" ? await compressImage(file) : file;
  const url = await uploadToCloudinary(blob, file.name);

  const ref = await addDoc(collection(db, "anexos"), {
    transacao_id: transacaoId,
    loja_id: lojaId,
    nome: file.name,
    url,
    tipo,
    criado_em: serverTimestamp(),
  });

  return {
    id: ref.id,
    transacaoId,
    nome: file.name,
    url,
    tipo,
    criadoEm: new Date().toISOString(),
  };
}

export async function excluirAnexo(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "anexos", id));
    return true;
  } catch {
    return false;
  }
}

export async function contarAnexos(transacaoIds: string[]): Promise<Record<string, number>> {
  if (transacaoIds.length === 0) return {};

  const counts: Record<string, number> = {};
  const batchSize = 30;
  for (let i = 0; i < transacaoIds.length; i += batchSize) {
    const batch = transacaoIds.slice(i, i + batchSize);
    const q = query(collection(db, "anexos"), where("transacao_id", "in", batch));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const tid = d.data().transacao_id;
      counts[tid] = (counts[tid] ?? 0) + 1;
    }
  }
  return counts;
}
