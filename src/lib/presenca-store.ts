import { supabase } from "@/lib/supabase";
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

// ─── Mappers ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSessao(row: any): SessaoStore {
  return {
    id: row.id,
    data: row.data,
    tipo: row.tipo as TipoSessao,
    status: row.status as StatusSessao,
    tema: row.tema ?? null,
    descricao: row.descricao ?? null,
    pauta: row.pauta ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPresenca(row: any): PresencaStore {
  return {
    id: row.id,
    irmaoId: row.irmao_id,
    nome: row.nome,
    cim: row.cim,
    grau: row.grau,
    cargo: row.cargo,
    presente: row.presente,
    justificativa: row.justificativa ?? null,
  };
}

// ─── Sessões ────────────────────────────────────────────────

export async function getSessoes(): Promise<SessaoStore[]> {
  const lojaId = getLojaId();
  if (!lojaId) return [];
  const { data } = await supabase
    .from("sessoes")
    .select("*")
    .eq("loja_id", lojaId)
    .order("data", { ascending: false });
  return (data ?? []).map(mapSessao);
}

export async function getSessao(id: string): Promise<SessaoStore | undefined> {
  const { data } = await supabase.from("sessoes").select("*").eq("id", id).limit(1);
  return data?.[0] ? mapSessao(data[0]) : undefined;
}

export async function criarSessao(input: Omit<SessaoStore, "id" | "status">): Promise<SessaoStore> {
  const lojaId = getLojaId();
  const { data } = await supabase
    .from("sessoes")
    .insert({
      loja_id: lojaId,
      data: input.data,
      tipo: input.tipo,
      status: "RASCUNHO",
      tema: input.tema || null,
      descricao: input.descricao || null,
      pauta: input.pauta || null,
    })
    .select()
    .single();
  return mapSessao(data!);
}

export async function atualizarSessao(id: string, input: Partial<Omit<SessaoStore, "id">>): Promise<SessaoStore | null> {
  const updates: Record<string, unknown> = {};
  if (input.data !== undefined) updates.data = input.data;
  if (input.tipo !== undefined) updates.tipo = input.tipo;
  if (input.status !== undefined) updates.status = input.status;
  if (input.tema !== undefined) updates.tema = input.tema || null;
  if (input.descricao !== undefined) updates.descricao = input.descricao || null;
  if (input.pauta !== undefined) updates.pauta = input.pauta || null;

  const { data } = await supabase.from("sessoes").update(updates).eq("id", id).select().single();
  return data ? mapSessao(data) : null;
}

export async function excluirSessao(id: string): Promise<boolean> {
  const { error } = await supabase.from("sessoes").delete().eq("id", id);
  return !error;
}

// ─── Presenças ──────────────────────────────────────────────

export async function getPresencas(sessaoId: string): Promise<PresencaStore[]> {
  const { data } = await supabase
    .from("presencas")
    .select("*")
    .eq("sessao_id", sessaoId)
    .order("nome");
  return (data ?? []).map(mapPresenca);
}

export async function inicializarPresencas(sessaoId: string): Promise<PresencaStore[]> {
  const existing = await getPresencas(sessaoId);
  if (existing.length > 0) return existing;

  const irmaos = await getIrmaosAtivos();
  if (irmaos.length === 0) return [];

  const rows = irmaos.map((i) => ({
    sessao_id: sessaoId,
    irmao_id: i.id,
    nome: i.nome,
    cim: i.cim,
    grau: i.grau,
    cargo: i.cargo,
    presente: false,
    justificativa: null,
  }));

  const { data } = await supabase.from("presencas").insert(rows).select();

  await supabase.from("sessoes").update({ status: "ABERTA" }).eq("id", sessaoId).eq("status", "RASCUNHO");

  return (data ?? []).map(mapPresenca);
}

export async function salvarPresencas(sessaoId: string, presencas: PresencaStore[]): Promise<void> {
  for (const p of presencas) {
    await supabase
      .from("presencas")
      .update({ presente: p.presente, justificativa: p.justificativa })
      .eq("id", p.id);
  }
}

export async function concluirSessao(sessaoId: string, presencas: PresencaStore[]): Promise<void> {
  await salvarPresencas(sessaoId, presencas);
  await supabase.from("sessoes").update({ status: "CONCLUIDA" }).eq("id", sessaoId);
}

export async function reabrirSessao(sessaoId: string): Promise<void> {
  await supabase.from("sessoes").update({ status: "ABERTA" }).eq("id", sessaoId);
}

export async function atualizarStatusSessao(sessaoId: string, status: StatusSessao): Promise<void> {
  await supabase.from("sessoes").update({ status }).eq("id", sessaoId);
}

export async function getResumoPresenca(sessaoId: string): Promise<{ presentes: number; total: number }> {
  const presencas = await getPresencas(sessaoId);
  return {
    presentes: presencas.filter((p) => p.presente).length,
    total: presencas.length,
  };
}
