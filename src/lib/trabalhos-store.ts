import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { getLojaId, getSession } from "@/lib/auth-store";
import { uploadMedia, type MediaTipo } from "@/lib/media-upload";
import type { EntidadeId } from "@/lib/entidades";

/**
 * grauMinimo:
 *  0 = público (site institucional)
 *  1 = Aprendiz+  (pasta Drive APRENDIZES)
 *  2 = Companheiro+ (pasta Drive COMPANHEIROS)
 *  3 = Mestre (pasta Drive MESTRES)
 */
export type GrauMinimo = 0 | 1 | 2 | 3;

export type CategoriaTrabalho =
  | "FOTO"
  | "TRABALHO"
  | "DOCUMENTO"
  | "ACAO"
  | "EVENTO"
  | "OUTRO";

export interface MidiaTrabalho {
  url: string;
  tipo: MediaTipo;
  nome: string;
}

export interface Trabalho {
  id: string;
  lojaId: string;
  entidade: EntidadeId;
  titulo: string;
  descricao: string | null;
  categoria: CategoriaTrabalho;
  grauMinimo: GrauMinimo;
  publico: boolean;
  midias: MidiaTrabalho[];
  capaUrl: string | null;
  criadoPor: string | null;
  criadoEm: string;
}

export const CATEGORIA_TRABALHO_LABELS: Record<CategoriaTrabalho, string> = {
  FOTO: "Foto",
  TRABALHO: "Trabalho",
  DOCUMENTO: "Documento",
  ACAO: "Ação da Loja",
  EVENTO: "Evento",
  OUTRO: "Outro",
};

export const GRAU_MINIMO_LABELS: Record<GrauMinimo, string> = {
  0: "Público (site)",
  1: "APRENDIZES (grau 1+)",
  2: "COMPANHEIROS (grau 2+)",
  3: "MESTRES (grau 3)",
};

const GRAU_NIVEL: Record<string, number> = {
  APRENDIZ: 1,
  COMPANHEIRO: 2,
  MESTRE: 3,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tsToString(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "string") return ts;
  if (ts.toDate) return ts.toDate().toISOString();
  return new Date().toISOString();
}

function mapDoc(id: string, data: Record<string, unknown>): Trabalho {
  const ent = (data.entidade as EntidadeId) || "loja";
  return {
    id,
    lojaId: (data.loja_id as string) ?? "",
    entidade: ent === "associacao" || ent === "frafem" ? ent : "loja",
    titulo: (data.titulo as string) ?? "",
    descricao: (data.descricao as string | null) ?? null,
    categoria: (data.categoria as CategoriaTrabalho) ?? "OUTRO",
    grauMinimo: (data.grau_minimo as GrauMinimo) ?? 0,
    publico: Boolean(data.publico),
    midias: Array.isArray(data.midias) ? (data.midias as MidiaTrabalho[]) : [],
    capaUrl: (data.capa_url as string | null) ?? null,
    criadoPor: (data.criado_por as string | null) ?? null,
    criadoEm: tsToString(data.criado_em),
  };
}

/** Nível do usuário logado (Venerável = 3). Público = 0. */
export function getNivelAcessoUsuario(): number {
  const session = getSession();
  if (!session) return 0;
  if (session.cargo === "VENERAVEL" || session.tipo === "loja") return 3;
  return session.grauNivel ?? 1;
}

export function podeVerTrabalho(t: Trabalho, nivel: number): boolean {
  if (t.grauMinimo === 0 && t.publico) return true;
  if (nivel <= 0) return false;
  return nivel >= t.grauMinimo;
}

export async function getTrabalhos(): Promise<Trabalho[]> {
  const lojaId = getLojaId();
  if (!lojaId) return [];
  const q = query(collection(db, "trabalhos"), where("loja_id", "==", lojaId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapDoc(d.id, d.data()))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

/** Ações / galeria do site (público = true, grau 0). */
export async function getAcoesSite(): Promise<Trabalho[]> {
  const all = await getTrabalhos();
  return all.filter((t) => t.publico && t.grauMinimo === 0);
}

/** Trabalhos internos (restritos por grau — não vão ao site). */
export async function getTrabalhosInternos(): Promise<Trabalho[]> {
  const all = await getTrabalhos();
  const nivel = getNivelAcessoUsuario();
  return all.filter((t) => !t.publico && t.grauMinimo >= 1 && podeVerTrabalho(t, nivel));
}

/** Conteúdo liberado no site institucional (sem login). */
export async function getTrabalhosPublicos(
  lojaId?: string,
  entidade?: EntidadeId
): Promise<Trabalho[]> {
  const snap = lojaId
    ? await getDocs(
        query(
          collection(db, "trabalhos"),
          where("loja_id", "==", lojaId),
          where("publico", "==", true)
        )
      )
    : await getDocs(query(collection(db, "trabalhos"), where("publico", "==", true)));

  return snap.docs
    .map((d) => mapDoc(d.id, d.data()))
    .filter((t) => t.grauMinimo === 0 && t.publico && (!entidade || t.entidade === entidade))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function criarAcaoPublica(input: {
  titulo: string;
  descricao?: string | null;
  categoria?: CategoriaTrabalho;
  entidade?: EntidadeId;
  files?: File[];
}): Promise<Trabalho> {
  return criarTrabalho({
    titulo: input.titulo,
    descricao: input.descricao,
    categoria: input.categoria ?? "ACAO",
    entidade: input.entidade ?? "loja",
    grauMinimo: 0,
    publico: true,
    files: input.files,
  });
}

export async function getTrabalho(id: string): Promise<Trabalho | null> {
  const snap = await getDoc(doc(db, "trabalhos", id));
  if (!snap.exists()) return null;
  return mapDoc(snap.id, snap.data());
}

export async function criarTrabalho(input: {
  titulo: string;
  descricao?: string | null;
  categoria: CategoriaTrabalho;
  grauMinimo: GrauMinimo;
  publico: boolean;
  entidade?: EntidadeId;
  files?: File[];
}): Promise<Trabalho> {
  const lojaId = getLojaId();
  if (!lojaId) throw new Error("Sessão inválida.");
  const session = getSession();

  const midias: MidiaTrabalho[] = [];
  for (const file of input.files ?? []) {
    const { url, tipo } = await uploadMedia(file, "gloja-trabalhos");
    midias.push({ url, tipo, nome: file.name });
  }

  const capaUrl = midias.find((m) => m.tipo === "image")?.url ?? null;
  const entidade = input.entidade ?? "loja";

  const ref = await addDoc(collection(db, "trabalhos"), {
    loja_id: lojaId,
    entidade,
    titulo: input.titulo.trim(),
    descricao: input.descricao?.trim() || null,
    categoria: input.categoria,
    grau_minimo: input.grauMinimo,
    publico: input.grauMinimo === 0 ? input.publico : false,
    midias,
    capa_url: capaUrl,
    criado_por: session?.nome ?? null,
    criado_em: serverTimestamp(),
  });

  const snap = await getDoc(ref);
  return mapDoc(snap.id, snap.data()!);
}

export async function atualizarTrabalho(
  id: string,
  input: Partial<{
    titulo: string;
    descricao: string | null;
    categoria: CategoriaTrabalho;
    grauMinimo: GrauMinimo;
    publico: boolean;
  }>
): Promise<Trabalho | null> {
  const updates: Record<string, unknown> = {};
  if (input.titulo !== undefined) updates.titulo = input.titulo.trim();
  if (input.descricao !== undefined) updates.descricao = input.descricao?.trim() || null;
  if (input.categoria !== undefined) updates.categoria = input.categoria;
  if (input.grauMinimo !== undefined) {
    updates.grau_minimo = input.grauMinimo;
    if (input.grauMinimo !== 0) updates.publico = false;
  }
  if (input.publico !== undefined && (input.grauMinimo ?? 0) === 0) {
    updates.publico = input.publico;
  }

  await updateDoc(doc(db, "trabalhos", id), updates);
  return getTrabalho(id);
}

export async function adicionarMidiasTrabalho(id: string, files: File[]): Promise<Trabalho | null> {
  const atual = await getTrabalho(id);
  if (!atual) return null;

  const novas: MidiaTrabalho[] = [];
  for (const file of files) {
    const { url, tipo } = await uploadMedia(file, "gloja-trabalhos");
    novas.push({ url, tipo, nome: file.name });
  }

  const midias = [...atual.midias, ...novas];
  const capaUrl = atual.capaUrl ?? midias.find((m) => m.tipo === "image")?.url ?? null;

  await updateDoc(doc(db, "trabalhos", id), {
    midias,
    capa_url: capaUrl,
  });
  return getTrabalho(id);
}

export async function excluirTrabalho(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "trabalhos", id));
    return true;
  } catch {
    return false;
  }
}

export function grauToNivel(grau: string): number {
  return GRAU_NIVEL[grau] ?? 1;
}
