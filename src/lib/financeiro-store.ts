/**
 * Client-side persistence layer for transações financeiras.
 * Uses localStorage so data survives navigation between pages.
 * Will be replaced by Supabase/Prisma when the DB is connected.
 */

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

const STORAGE_KEY = "gloja-financeiro-store-v2";

const SEED: Transacao[] = [];

function load(): Transacao[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Transacao[];
  } catch { /* corrupted, reset */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
  return SEED;
}

function save(data: Transacao[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getTransacoes(): Transacao[] {
  return load();
}

export function criarTransacao(t: Omit<Transacao, "id">): Transacao {
  const all = load();
  const nova: Transacao = { ...t, id: `fin-${Date.now()}` };
  all.unshift(nova);
  save(all);
  return nova;
}

export function atualizarTransacao(id: string, data: Partial<Omit<Transacao, "id">>): Transacao | null {
  const all = load();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...data };
  save(all);
  return all[idx];
}

export function excluirTransacao(id: string): boolean {
  const all = load();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  all.splice(idx, 1);
  save(all);
  return true;
}

export function toggleStatus(id: string): Transacao | null {
  const all = load();
  const item = all.find((t) => t.id === id);
  if (!item) return null;
  item.status = item.status === "PAGO" ? "PENDENTE" : "PAGO";
  save(all);
  return item;
}
