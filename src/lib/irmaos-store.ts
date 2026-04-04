import { supabase } from "@/lib/supabase";
import { getLojaId } from "@/lib/auth-store";
import type { Irmao } from "@/types/irmao";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Irmao {
  return {
    id: row.id,
    nome: row.nome,
    cim: row.cim,
    cpf: row.cpf ?? null,
    email: row.email ?? null,
    telefone: row.telefone ?? null,
    grau: row.grau,
    cargo: row.cargo,
    status: row.status,
    dataNasc: row.data_nasc ?? null,
    dataIniciacao: row.data_iniciacao ?? null,
  };
}

export async function getIrmaos(): Promise<Irmao[]> {
  const lojaId = getLojaId();
  if (!lojaId) return [];
  const { data } = await supabase
    .from("irmaos")
    .select("*")
    .eq("loja_id", lojaId)
    .order("nome");
  return (data ?? []).map(mapRow);
}

export async function getIrmao(id: string): Promise<Irmao | undefined> {
  const { data } = await supabase
    .from("irmaos")
    .select("*")
    .eq("id", id)
    .limit(1);
  return data?.[0] ? mapRow(data[0]) : undefined;
}

export async function getIrmaosAtivos(): Promise<Irmao[]> {
  const lojaId = getLojaId();
  if (!lojaId) return [];
  const { data } = await supabase
    .from("irmaos")
    .select("*")
    .eq("loja_id", lojaId)
    .eq("status", "ATIVO")
    .order("nome");
  return (data ?? []).map(mapRow);
}

export async function criarIrmao(input: Omit<Irmao, "id">): Promise<Irmao> {
  const lojaId = getLojaId();
  const { data } = await supabase
    .from("irmaos")
    .insert({
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
    })
    .select()
    .single();
  return mapRow(data!);
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

  const { data } = await supabase
    .from("irmaos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return data ? mapRow(data) : null;
}

export async function excluirIrmao(id: string): Promise<boolean> {
  const { error } = await supabase.from("irmaos").delete().eq("id", id);
  return !error;
}
