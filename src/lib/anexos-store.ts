import { supabase } from "@/lib/supabase";
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
function mapRow(row: any): Anexo {
  return {
    id: row.id,
    transacaoId: row.transacao_id,
    nome: row.nome,
    url: row.url,
    tipo: row.tipo,
    criadoEm: row.criado_em,
  };
}

function detectTipo(file: File): "image" | "pdf" | "other" {
  if (isImage(file)) return "image";
  if (file.type === "application/pdf") return "pdf";
  return "other";
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dx4dgjuib";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "gloja-anexos";

async function uploadToCloudinary(blob: Blob, fileName: string): Promise<string> {
  const cloudName = CLOUDINARY_CLOUD_NAME;
  const preset = CLOUDINARY_UPLOAD_PRESET;

  const fd = new FormData();
  fd.append("file", blob, fileName);
  fd.append("upload_preset", preset);
  fd.append("folder", "gloja-anexos");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
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
  const { data } = await supabase
    .from("anexos")
    .select("*")
    .eq("transacao_id", transacaoId)
    .order("criado_em", { ascending: false });
  return (data ?? []).map(mapRow);
}

export async function getAnexosMulti(transacaoIds: string[]): Promise<Record<string, Anexo[]>> {
  if (transacaoIds.length === 0) return {};
  const { data } = await supabase
    .from("anexos")
    .select("*")
    .in("transacao_id", transacaoIds)
    .order("criado_em", { ascending: false });

  const map: Record<string, Anexo[]> = {};
  for (const row of data ?? []) {
    const a = mapRow(row);
    if (!map[a.transacaoId]) map[a.transacaoId] = [];
    map[a.transacaoId].push(a);
  }
  return map;
}

export async function uploadAnexo(transacaoId: string, file: File): Promise<Anexo> {
  const lojaId = getLojaId();
  if (!lojaId) throw new Error("Sessão inválida.");

  const tipo = detectTipo(file);
  const blob = tipo === "image" ? await compressImage(file) : file;
  const url = await uploadToCloudinary(blob, file.name);

  const { data, error } = await supabase
    .from("anexos")
    .insert({
      transacao_id: transacaoId,
      loja_id: lojaId,
      nome: file.name,
      url,
      tipo,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Erro ao salvar anexo.");
  return mapRow(data);
}

export async function excluirAnexo(id: string): Promise<boolean> {
  const { error } = await supabase.from("anexos").delete().eq("id", id);
  return !error;
}

export async function contarAnexos(transacaoIds: string[]): Promise<Record<string, number>> {
  if (transacaoIds.length === 0) return {};
  const { data } = await supabase
    .from("anexos")
    .select("transacao_id")
    .in("transacao_id", transacaoIds);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const tid = (row as { transacao_id: string }).transacao_id;
    counts[tid] = (counts[tid] ?? 0) + 1;
  }
  return counts;
}
