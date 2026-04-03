/**
 * Client-side persistence layer for Irmãos (membros).
 * Uses localStorage so data survives navigation between pages.
 * Will be replaced by Supabase/Prisma when the DB is connected.
 */

import type { Irmao } from "@/types/irmao";

const STORAGE_KEY = "gloja-irmaos-store";

const SEED: Irmao[] = [
  { id: "1", nome: "José Carlos Almeida", cim: "12.345", cpf: "123.456.789-01", email: "jose.almeida@email.com", telefone: "(11) 98765-4321", grau: "MESTRE", cargo: "VENERAVEL", status: "ATIVO", dataNasc: "1975-03-12", dataIniciacao: "2001-08-15" },
  { id: "2", nome: "Ricardo Henrique Souza", cim: "12.346", cpf: "234.567.890-12", email: "ricardo.souza@email.com", telefone: "(21) 97654-3210", grau: "COMPANHEIRO", cargo: "PRIMEIRO_VIGILANTE", status: "ATIVO", dataNasc: "1982-07-22", dataIniciacao: "2010-11-20" },
  { id: "3", nome: "Paulo Roberto Mendes", cim: "12.347", cpf: null, email: null, telefone: "(31) 98888-7766", grau: "APRENDIZ", cargo: "MEMBRO", status: "ADORMECIDO", dataNasc: "1990-01-05", dataIniciacao: "2018-04-10" },
  { id: "4", nome: "Antônio Augusto Ferreira", cim: "12.348", cpf: "345.678.901-23", email: "antonio.ferreira@email.com", telefone: "(41) 99999-1122", grau: "MESTRE", cargo: "SECRETARIO", status: "ATIVO", dataNasc: "1968-11-30", dataIniciacao: "1995-02-28" },
  { id: "5", nome: "Marcos Vinícius Lima", cim: "12.349", cpf: "456.789.012-34", email: "marcos.lima@email.com", telefone: "(51) 91234-5678", grau: "COMPANHEIRO", cargo: "TESOUREIRO", status: "PLACET", dataNasc: "1988-09-14", dataIniciacao: "2015-06-18" },
  { id: "6", nome: "Fernando Oliveira Costa", cim: "12.350", cpf: null, email: "fernando.costa@email.com", telefone: null, grau: "MESTRE", cargo: "ORADOR", status: "IRREGULAR", dataNasc: "1979-04-25", dataIniciacao: "2005-09-09" },
  { id: "7", nome: "Eduardo Santos Ribeiro", cim: "12.351", cpf: "567.890.123-45", email: null, telefone: "(61) 99876-5432", grau: "COMPANHEIRO", cargo: "HOSPITALEIRO", status: "ATIVO", dataNasc: "1992-12-08", dataIniciacao: "2019-03-22" },
  { id: "8", nome: "Felipe Andrade Nunes", cim: "12.352", cpf: "678.901.234-56", email: "felipe.nunes@email.com", telefone: "(71) 98765-1234", grau: "APRENDIZ", cargo: "MEMBRO", status: "ATIVO", dataNasc: "1995-06-17", dataIniciacao: "2023-10-12" },
  { id: "9", nome: "Carlos Alberto Pereira", cim: "12.353", cpf: null, email: "carlos.pereira@email.com", telefone: "(81) 99887-6543", grau: "MESTRE", cargo: "CHANCELER", status: "ATIVO", dataNasc: "1970-08-20", dataIniciacao: "1998-05-14" },
  { id: "10", nome: "Gustavo Martins Silva", cim: "12.354", cpf: null, email: null, telefone: "(91) 98765-9876", grau: "MESTRE", cargo: "MESTRE_CERIMONIAS", status: "ATIVO", dataNasc: "1985-02-11", dataIniciacao: "2008-09-30" },
  { id: "11", nome: "Luís Fernando Borges", cim: "12.355", cpf: null, email: "luis.borges@email.com", telefone: null, grau: "COMPANHEIRO", cargo: "MEMBRO", status: "ATIVO", dataNasc: "1993-11-03", dataIniciacao: "2020-07-18" },
  { id: "12", nome: "Rafael Carvalho Dias", cim: "12.356", cpf: null, email: null, telefone: "(11) 91122-3344", grau: "APRENDIZ", cargo: "MEMBRO", status: "ATIVO", dataNasc: "1998-04-29", dataIniciacao: "2024-01-25" },
];

function load(): Irmao[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Irmao[];
  } catch { /* corrupted, reset */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
  return SEED;
}

function save(data: Irmao[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getIrmaos(): Irmao[] {
  return load();
}

export function getIrmao(id: string): Irmao | undefined {
  return load().find((i) => i.id === id);
}

export function getIrmaosAtivos(): Irmao[] {
  return load().filter((i) => i.status === "ATIVO");
}

export function criarIrmao(data: Omit<Irmao, "id">): Irmao {
  const all = load();
  const novo: Irmao = { ...data, id: `irm-${Date.now()}` };
  all.push(novo);
  save(all);
  return novo;
}

export function atualizarIrmao(id: string, data: Partial<Omit<Irmao, "id">>): Irmao | null {
  const all = load();
  const idx = all.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...data };
  save(all);
  return all[idx];
}

export function excluirIrmao(id: string): boolean {
  const all = load();
  const idx = all.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  all.splice(idx, 1);
  save(all);
  return true;
}
