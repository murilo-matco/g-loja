/**
 * Client-side persistence layer for sessões and presenças.
 * Uses localStorage so data survives navigation between pages.
 * Will be replaced by Supabase/Prisma when the DB is connected.
 */

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

interface StoreData {
  sessoes: SessaoStore[];
  presencas: Record<string, PresencaStore[]>; // keyed by sessaoId
}

// ─── Seed Data ──────────────────────────────────────────────

const SEED_SESSOES: SessaoStore[] = [];

function loadIrmaosAtivos(): Omit<PresencaStore, "id" | "presente" | "justificativa">[] {
  return getIrmaosAtivos().map((i) => ({
    irmaoId: i.id,
    nome: i.nome,
    cim: i.cim,
    grau: i.grau,
    cargo: i.cargo,
  }));
}

// ─── Storage ────────────────────────────────────────────────

const STORAGE_KEY = "gloja-presenca-store-v2";

function loadStore(): StoreData {
  if (typeof window === "undefined") {
    return { sessoes: [], presencas: {} };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoreData;
  } catch {
    // corrupted data, reset
  }

  const initial: StoreData = {
    sessoes: SEED_SESSOES,
    presencas: {},
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveStore(data: StoreData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Public API ─────────────────────────────────────────────

export function getSessoes(): SessaoStore[] {
  return loadStore().sessoes;
}

export function getSessao(id: string): SessaoStore | undefined {
  return loadStore().sessoes.find((s) => s.id === id);
}

export function criarSessao(sessao: Omit<SessaoStore, "id" | "status">): SessaoStore {
  const store = loadStore();
  const nova: SessaoStore = {
    ...sessao,
    id: `sess-${Date.now()}`,
    status: "RASCUNHO",
  };
  store.sessoes.unshift(nova);
  saveStore(store);
  return nova;
}

export function atualizarSessao(id: string, data: Partial<Omit<SessaoStore, "id">>): SessaoStore | null {
  const store = loadStore();
  const idx = store.sessoes.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  store.sessoes[idx] = { ...store.sessoes[idx], ...data };
  saveStore(store);
  return store.sessoes[idx];
}

export function excluirSessao(id: string): boolean {
  const store = loadStore();
  const idx = store.sessoes.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  store.sessoes.splice(idx, 1);
  delete store.presencas[id];
  saveStore(store);
  return true;
}

export function getPresencas(sessaoId: string): PresencaStore[] {
  const store = loadStore();
  return store.presencas[sessaoId] ?? [];
}

export function inicializarPresencas(sessaoId: string): PresencaStore[] {
  const store = loadStore();

  if (!store.presencas[sessaoId] || store.presencas[sessaoId].length === 0) {
    const irmaos = loadIrmaosAtivos();
    store.presencas[sessaoId] = irmaos.map((irmao, i) => ({
      id: `${sessaoId}-p${String(i + 1).padStart(2, "0")}`,
      ...irmao,
      presente: false,
      justificativa: null,
    }));
  }

  const sessao = store.sessoes.find((s) => s.id === sessaoId);
  if (sessao && sessao.status === "RASCUNHO") {
    sessao.status = "ABERTA";
  }

  saveStore(store);
  return store.presencas[sessaoId];
}

export function salvarPresencas(sessaoId: string, presencas: PresencaStore[]) {
  const store = loadStore();
  store.presencas[sessaoId] = presencas;
  saveStore(store);
}

export function concluirSessao(sessaoId: string, presencas: PresencaStore[]) {
  const store = loadStore();

  store.presencas[sessaoId] = presencas;

  const sessao = store.sessoes.find((s) => s.id === sessaoId);
  if (sessao) {
    sessao.status = "CONCLUIDA";
  }

  saveStore(store);
}

export function reabrirSessao(sessaoId: string) {
  const store = loadStore();
  const sessao = store.sessoes.find((s) => s.id === sessaoId);
  if (sessao) {
    sessao.status = "ABERTA";
  }
  saveStore(store);
}

export function atualizarStatusSessao(sessaoId: string, status: StatusSessao) {
  const store = loadStore();
  const sessao = store.sessoes.find((s) => s.id === sessaoId);
  if (sessao) {
    sessao.status = status;
  }
  saveStore(store);
}

export function getResumoPresenca(sessaoId: string): { presentes: number; total: number } {
  const presencas = getPresencas(sessaoId);
  return {
    presentes: presencas.filter((p) => p.presente).length,
    total: presencas.length,
  };
}

export function resetStore() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
