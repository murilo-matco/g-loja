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
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { getLojaId } from "@/lib/auth-store";
import { getIrmaosAtivos } from "@/lib/irmaos-store";

// ─── Types ──────────────────────────────────────────────────

export type StatusSessao = "RASCUNHO" | "ABERTA" | "CONCLUIDA";
export type TipoSessao = "ORDINARIA" | "EXTRAORDINARIA" | "MAGNA" | "BRANCA" | "FUNEBRE";

export interface SessaoStore {
  id: string;
  data: string;
  tipo: TipoSessao;
  status: StatusSessao;
  tema: string | null;
  descricao: string | null;
  pauta: string | null;
}

export interface PresencaStore {
  id: string;
  irmaoId: string;
  nome: string;
  cim: string;
  grau: string;
  cargo: string;
  presente: boolean;
  justificativa: string | null;
}

// ─── Sessões ────────────────────────────────────────────────

export async function getSessoes(): Promise<SessaoStore[]> {
  const lojaId = getLojaId();
  if (!lojaId) return [];
  const q = query(collection(db, "sessoes"), where("loja_id", "==", lojaId), orderBy("data", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      data: data.data,
      tipo: data.tipo as TipoSessao,
      status: data.status as StatusSessao,
      tema: data.tema ?? null,
      descricao: data.descricao ?? null,
      pauta: data.pauta ?? null,
    };
  });
}

export async function getSessao(id: string): Promise<SessaoStore | undefined> {
  const snap = await getDoc(doc(db, "sessoes", id));
  if (!snap.exists()) return undefined;
  const data = snap.data();
  return {
    id: snap.id,
    data: data.data,
    tipo: data.tipo as TipoSessao,
    status: data.status as StatusSessao,
    tema: data.tema ?? null,
    descricao: data.descricao ?? null,
    pauta: data.pauta ?? null,
  };
}

export async function criarSessao(input: Omit<SessaoStore, "id" | "status">): Promise<SessaoStore> {
  const lojaId = getLojaId();
  const ref = await addDoc(collection(db, "sessoes"), {
    loja_id: lojaId,
    data: input.data,
    tipo: input.tipo,
    status: "RASCUNHO",
    tema: input.tema || null,
    descricao: input.descricao || null,
    pauta: input.pauta || null,
    criado_em: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  const d = snap.data()!;
  return {
    id: snap.id,
    data: d.data,
    tipo: d.tipo as TipoSessao,
    status: d.status as StatusSessao,
    tema: d.tema ?? null,
    descricao: d.descricao ?? null,
    pauta: d.pauta ?? null,
  };
}

export async function atualizarSessao(id: string, input: Partial<Omit<SessaoStore, "id">>): Promise<SessaoStore | null> {
  const updates: Record<string, unknown> = {};
  if (input.data !== undefined) updates.data = input.data;
  if (input.tipo !== undefined) updates.tipo = input.tipo;
  if (input.status !== undefined) updates.status = input.status;
  if (input.tema !== undefined) updates.tema = input.tema || null;
  if (input.descricao !== undefined) updates.descricao = input.descricao || null;
  if (input.pauta !== undefined) updates.pauta = input.pauta || null;

  await updateDoc(doc(db, "sessoes", id), updates);
  return (await getSessao(id)) || null;
}

export async function excluirSessao(id: string): Promise<boolean> {
  try {
    const q = query(collection(db, "presencas"), where("sessao_id", "==", id));
    const presencas = await getDocs(q);
    const batch = writeBatch(db);
    presencas.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, "sessoes", id));
    await batch.commit();
    return true;
  } catch {
    return false;
  }
}

// ─── Presenças ──────────────────────────────────────────────

export async function getPresencas(sessaoId: string): Promise<PresencaStore[]> {
  const q = query(collection(db, "presencas"), where("sessao_id", "==", sessaoId), orderBy("nome"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      irmaoId: data.irmao_id,
      nome: data.nome,
      cim: data.cim,
      grau: data.grau,
      cargo: data.cargo,
      presente: data.presente,
      justificativa: data.justificativa ?? null,
    };
  });
}

export async function inicializarPresencas(sessaoId: string): Promise<PresencaStore[]> {
  const existing = await getPresencas(sessaoId);
  if (existing.length > 0) return existing;

  const irmaos = await getIrmaosAtivos();
  if (irmaos.length === 0) return [];

  const batch = writeBatch(db);
  const refs: string[] = [];
  for (const i of irmaos) {
    const ref = doc(collection(db, "presencas"));
    refs.push(ref.id);
    batch.set(ref, {
      sessao_id: sessaoId,
      irmao_id: i.id,
      nome: i.nome,
      cim: i.cim,
      grau: i.grau,
      cargo: i.cargo,
      presente: false,
      justificativa: null,
    });
  }
  await batch.commit();

  await updateDoc(doc(db, "sessoes", sessaoId), { status: "ABERTA" });

  return getPresencas(sessaoId);
}

export async function salvarPresencas(sessaoId: string, presencas: PresencaStore[]): Promise<void> {
  const batch = writeBatch(db);
  for (const p of presencas) {
    batch.update(doc(db, "presencas", p.id), {
      presente: p.presente,
      justificativa: p.justificativa,
    });
  }
  await batch.commit();
}

export async function concluirSessao(sessaoId: string, presencas: PresencaStore[]): Promise<void> {
  await salvarPresencas(sessaoId, presencas);
  await updateDoc(doc(db, "sessoes", sessaoId), { status: "CONCLUIDA" });
}

export async function reabrirSessao(sessaoId: string): Promise<void> {
  await updateDoc(doc(db, "sessoes", sessaoId), { status: "ABERTA" });
}

export async function atualizarStatusSessao(sessaoId: string, status: StatusSessao): Promise<void> {
  await updateDoc(doc(db, "sessoes", sessaoId), { status });
}

export async function getResumoPresenca(sessaoId: string): Promise<{ presentes: number; total: number }> {
  const presencas = await getPresencas(sessaoId);
  return {
    presentes: presencas.filter((p) => p.presente).length,
    total: presencas.length,
  };
}
