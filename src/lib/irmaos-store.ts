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
} from "firebase/firestore";
import { getLojaId } from "@/lib/auth-store";
import type { Irmao } from "@/types/irmao";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(id: string, data: any): Irmao {
  return {
    id,
    nome: data.nome,
    cim: data.cim,
    cpf: data.cpf ?? null,
    email: data.email ?? null,
    telefone: data.telefone ?? null,
    grau: data.grau,
    cargo: data.cargo,
    status: data.status,
    dataNasc: data.data_nasc ?? null,
    dataIniciacao: data.data_iniciacao ?? null,
  };
}

export async function getIrmaos(): Promise<Irmao[]> {
  const lojaId = getLojaId();
  if (!lojaId) return [];
  const q = query(collection(db, "irmaos"), where("loja_id", "==", lojaId), orderBy("nome"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapRow(d.id, d.data()));
}

export async function getIrmao(id: string): Promise<Irmao | undefined> {
  const snap = await getDoc(doc(db, "irmaos", id));
  if (!snap.exists()) return undefined;
  return mapRow(snap.id, snap.data());
}

export async function getIrmaosAtivos(): Promise<Irmao[]> {
  const lojaId = getLojaId();
  if (!lojaId) return [];
  const q = query(
    collection(db, "irmaos"),
    where("loja_id", "==", lojaId),
    where("status", "==", "ATIVO"),
    orderBy("nome")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapRow(d.id, d.data()));
}

export async function criarIrmao(input: Omit<Irmao, "id">): Promise<Irmao> {
  const lojaId = getLojaId();
  const ref = await addDoc(collection(db, "irmaos"), {
    loja_id: lojaId,
    nome: input.nome,
    cim: input.cim,
    cpf: input.cpf || null,
    email: input.email || null,
    telefone: input.telefone || null,
    grau: input.grau,
    cargo: input.cargo,
    status: input.status,
    data_nasc: input.dataNasc || null,
    data_iniciacao: input.dataIniciacao || null,
    criado_em: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return mapRow(snap.id, snap.data());
}

export async function atualizarIrmao(id: string, input: Partial<Omit<Irmao, "id">>): Promise<Irmao | null> {
  const updates: Record<string, unknown> = {};
  if (input.nome !== undefined) updates.nome = input.nome;
  if (input.cim !== undefined) updates.cim = input.cim;
  if (input.cpf !== undefined) updates.cpf = input.cpf || null;
  if (input.email !== undefined) updates.email = input.email || null;
  if (input.telefone !== undefined) updates.telefone = input.telefone || null;
  if (input.grau !== undefined) updates.grau = input.grau;
  if (input.cargo !== undefined) updates.cargo = input.cargo;
  if (input.status !== undefined) updates.status = input.status;
  if (input.dataNasc !== undefined) updates.data_nasc = input.dataNasc || null;
  if (input.dataIniciacao !== undefined) updates.data_iniciacao = input.dataIniciacao || null;

  await updateDoc(doc(db, "irmaos", id), updates);
  const snap = await getDoc(doc(db, "irmaos", id));
  return snap.exists() ? mapRow(snap.id, snap.data()) : null;
}

export async function excluirIrmao(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "irmaos", id));
    return true;
  } catch {
    return false;
  }
}
