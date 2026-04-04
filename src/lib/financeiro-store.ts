import { supabase } from "@/lib/supabase";
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
function mapRow(row: any): Transacao {
  return {
    id: row.id,
    tipo: row.tipo as TipoTransacao,
    descricao: row.descricao,
    categoria: row.categoria,
    valor: Number(row.valor),
    vencimento: row.vencimento,
    status: row.status as StatusPagamento,
    irmao: row.irmao ?? null,
  };
}

export async function getTransacoes(): Promise<Transacao[]> {
  const lojaId = getLojaId();
  if (!lojaId) return [];
  const { data } = await supabase
    .from("transacoes")
    .select("*")
    .eq("loja_id", lojaId)
    .order("criado_em", { ascending: false });
  return (data ?? []).map(mapRow);
}

export async function criarTransacao(t: Omit<Transacao, "id">): Promise<Transacao> {
  const lojaId = getLojaId();
  const { data } = await supabase
    .from("transacoes")
    .insert({
      loja_id: lojaId,
      tipo: t.tipo,
      descricao: t.descricao,
      categoria: t.categoria,
      valor: t.valor,
      vencimento: t.vencimento,
      status: t.status,
      irmao: t.irmao || null,
    })
    .select()
    .single();
  return mapRow(data!);
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

  const { data } = await supabase.from("transacoes").update(updates).eq("id", id).select().single();
  return data ? mapRow(data) : null;
}

export async function excluirTransacao(id: string): Promise<boolean> {
  const { error } = await supabase.from("transacoes").delete().eq("id", id);
  return !error;
}

export async function toggleStatus(id: string): Promise<Transacao | null> {
  const { data: current } = await supabase.from("transacoes").select("status").eq("id", id).single();
  if (!current) return null;

  const newStatus = current.status === "PAGO" ? "PENDENTE" : "PAGO";
  const { data } = await supabase.from("transacoes").update({ status: newStatus }).eq("id", id).select().single();
  return data ? mapRow(data) : null;
}
