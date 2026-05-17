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
import { getLojaId } from "@/lib/auth-store";

export type TipoTransacao = "RECEITA" | "DESPESA";
export type StatusPagamento = "PAGO" | "PENDENTE";

export interface Transacao {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  categoria: string;
  valor: number;
  vencimento: string;
  status: StatusPagamento;
  irmao: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(id: string, data: any): Transacao {
  return {
    id,
    tipo: data.tipo as TipoTransacao,
    descricao: data.descricao,
    categoria: data.categoria,
    valor: Number(data.valor),
    vencimento: data.vencimento,
    status: data.status as StatusPagamento,
    irmao: data.irmao ?? null,
  };
}

export async function getTransacoes(): Promise<Transacao[]> {
  const lojaId = getLojaId();
  if (!lojaId) return [];
  const q = query(collection(db, "transacoes"), where("loja_id", "==", lojaId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapRow(d.id, d.data())).sort((a, b) => b.id.localeCompare(a.id));
}

export async function criarTransacao(t: Omit<Transacao, "id">): Promise<Transacao> {
  const lojaId = getLojaId();
  const ref = await addDoc(collection(db, "transacoes"), {
    loja_id: lojaId,
    tipo: t.tipo,
    descricao: t.descricao,
    categoria: t.categoria,
    valor: t.valor,
    vencimento: t.vencimento,
    status: t.status,
    irmao: t.irmao || null,
    criado_em: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return mapRow(snap.id, snap.data());
}

export async function atualizarTransacao(id: string, input: Partial<Omit<Transacao, "id">>): Promise<Transacao | null> {
  const updates: Record<string, unknown> = {};
  if (input.tipo !== undefined) updates.tipo = input.tipo;
  if (input.descricao !== undefined) updates.descricao = input.descricao;
  if (input.categoria !== undefined) updates.categoria = input.categoria;
  if (input.valor !== undefined) updates.valor = input.valor;
  if (input.vencimento !== undefined) updates.vencimento = input.vencimento;
  if (input.status !== undefined) updates.status = input.status;
  if (input.irmao !== undefined) updates.irmao = input.irmao || null;

  await updateDoc(doc(db, "transacoes", id), updates);
  const snap = await getDoc(doc(db, "transacoes", id));
  return snap.exists() ? mapRow(snap.id, snap.data()) : null;
}

export async function excluirTransacao(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "transacoes", id));
    return true;
  } catch {
    return false;
  }
}

export async function toggleStatus(id: string): Promise<Transacao | null> {
  const snap = await getDoc(doc(db, "transacoes", id));
  if (!snap.exists()) return null;

  const newStatus = snap.data().status === "PAGO" ? "PENDENTE" : "PAGO";
  await updateDoc(doc(db, "transacoes", id), { status: newStatus });
  const updated = await getDoc(doc(db, "transacoes", id));
  return updated.exists() ? mapRow(updated.id, updated.data()) : null;
}
