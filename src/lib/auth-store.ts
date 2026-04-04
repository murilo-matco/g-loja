import { supabase } from "@/lib/supabase";

const SESSION_KEY = "gloja-auth";

// ─── Cargos com acesso ao sistema ───────────────────────────

export type CargoSistema =
  | "VENERAVEL"
  | "CHANCELER"
  | "TESOUREIRO"
  | "SECRETARIO"
  | "ORADOR"
  | "PRIMEIRO_VIGILANTE"
  | "SEGUNDO_VIGILANTE";

export const CARGO_SISTEMA_LABELS: Record<CargoSistema, string> = {
  VENERAVEL: "Venerável Mestre",
  CHANCELER: "Chanceler",
  TESOUREIRO: "Tesoureiro",
  SECRETARIO: "Secretário",
  ORADOR: "Orador",
  PRIMEIRO_VIGILANTE: "1º Vigilante",
  SEGUNDO_VIGILANTE: "2º Vigilante",
};

export const PERMISSOES: Record<CargoSistema, string[]> = {
  VENERAVEL: ["/", "/irmaos", "/sessoes", "/presenca", "/financeiro", "/relatorios", "/configuracoes"],
  CHANCELER: ["/", "/presenca"],
  TESOUREIRO: ["/", "/financeiro"],
  SECRETARIO: ["/", "/irmaos", "/sessoes", "/relatorios"],
  ORADOR: ["/", "/sessoes", "/relatorios"],
  PRIMEIRO_VIGILANTE: ["/", "/irmaos", "/sessoes", "/presenca", "/relatorios"],
  SEGUNDO_VIGILANTE: ["/", "/sessoes", "/presenca"],
};

// ─── Types ──────────────────────────────────────────────────

export interface Loja {
  id: string;
  cnpj: string;
  senha: string;
  nome: string;
  oriente: string;
  nome_admin: string;
  primeiro_acesso: boolean;
  criado_em: string;
}

export interface Usuario {
  id: string;
  loja_id: string;
  cpf: string;
  nome: string;
  cargo: CargoSistema;
  senha: string;
  primeiroAcesso: boolean;
  ativo: boolean;
  criadoEm: string;
}

export interface AuthSession {
  tipo: "loja" | "usuario";
  id: string;
  lojaId: string;
  cnpj?: string;
  cpf?: string;
  nome: string;
  cargo: CargoSistema;
  nomeLoja: string;
  oriente: string;
  permissoes: string[];
  logadoEm: string;
}

// ─── Session (sync — reads from sessionStorage) ─────────────

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.cargo || !Array.isArray(parsed.permissoes) || !parsed.lojaId) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

export function getLojaId(): string | null {
  return getSession()?.lojaId ?? null;
}

export function temPermissao(rota: string): boolean {
  const session = getSession();
  if (!session) return false;
  if (session.cargo === "VENERAVEL") return true;
  if (!Array.isArray(session.permissoes)) return false;
  return session.permissoes.some((p) => {
    if (p === "/") return rota === "/";
    return rota === p || rota.startsWith(p + "/");
  });
}

export function isAdmin(): boolean {
  return getSession()?.cargo === "VENERAVEL";
}

// ─── Login (async — queries Supabase) ───────────────────────

export async function login(
  identificador: string,
  senha: string
): Promise<{ ok: true; session: AuthSession } | { ok: false; erro: string }> {
  const digits = identificador.replace(/\D/g, "");

  if (digits.length >= 14) {
    return loginLoja(identificador, senha);
  }
  if (digits.length === 11) {
    return loginUsuario(identificador, senha);
  }

  const tentaLoja = await loginLoja(identificador, senha);
  if (tentaLoja.ok) return tentaLoja;
  const tentaUser = await loginUsuario(identificador, senha);
  if (tentaUser.ok) return tentaUser;

  return { ok: false, erro: "CPF ou CNPJ não encontrado no sistema." };
}

async function loginLoja(cnpj: string, senha: string): Promise<{ ok: true; session: AuthSession } | { ok: false; erro: string }> {
  const clean = cnpj.replace(/\D/g, "");
  const { data: lojas } = await supabase.from("lojas").select("*");
  const loja = lojas?.find((l: Loja) => l.cnpj.replace(/\D/g, "") === clean);

  if (!loja) return { ok: false, erro: "CNPJ não cadastrado no sistema." };
  if (loja.senha !== senha) return { ok: false, erro: "Senha incorreta." };

  const session: AuthSession = {
    tipo: "loja",
    id: loja.id,
    lojaId: loja.id,
    cnpj: loja.cnpj,
    nome: loja.nome_admin,
    cargo: "VENERAVEL",
    nomeLoja: loja.nome,
    oriente: loja.oriente,
    permissoes: PERMISSOES.VENERAVEL,
    logadoEm: new Date().toISOString(),
  };
  saveSession(session);
  return { ok: true, session };
}

async function loginUsuario(cpf: string, senha: string): Promise<{ ok: true; session: AuthSession } | { ok: false; erro: string }> {
  const clean = cpf.replace(/\D/g, "");
  const { data: users } = await supabase.from("usuarios").select("*");
  const user = users?.find((u: { cpf: string }) => u.cpf.replace(/\D/g, "") === clean);

  if (!user) return { ok: false, erro: "CPF não cadastrado no sistema." };
  if (!user.ativo) return { ok: false, erro: "Acesso desativado. Contate o Venerável." };
  if (user.senha !== senha) return { ok: false, erro: "Senha incorreta." };

  const { data: lojas } = await supabase.from("lojas").select("*").eq("id", user.loja_id).limit(1);
  const loja = lojas?.[0];

  const session: AuthSession = {
    tipo: "usuario",
    id: user.id,
    lojaId: user.loja_id,
    cpf: user.cpf,
    nome: user.nome,
    cargo: user.cargo as CargoSistema,
    nomeLoja: loja?.nome ?? "G-Loja",
    oriente: loja?.oriente ?? "",
    permissoes: PERMISSOES[user.cargo as CargoSistema] ?? ["/"],
    logadoEm: new Date().toISOString(),
  };
  saveSession(session);
  return { ok: true, session };
}

// ─── Alterar senha ──────────────────────────────────────────

export async function alterarSenhaLoja(cnpj: string, senhaAtual: string, novaSenha: string): Promise<{ ok: boolean; erro?: string }> {
  const clean = cnpj.replace(/\D/g, "");
  const { data: lojas } = await supabase.from("lojas").select("*");
  const loja = lojas?.find((l: Loja) => l.cnpj.replace(/\D/g, "") === clean);

  if (!loja) return { ok: false, erro: "Loja não encontrada." };
  if (loja.senha !== senhaAtual) return { ok: false, erro: "Senha atual incorreta." };
  if (novaSenha.length < 6) return { ok: false, erro: "Nova senha deve ter ao menos 6 caracteres." };

  await supabase.from("lojas").update({ senha: novaSenha, primeiro_acesso: false }).eq("id", loja.id);
  return { ok: true };
}

export async function alterarSenhaUsuario(cpf: string, senhaAtual: string, novaSenha: string): Promise<{ ok: boolean; erro?: string }> {
  const clean = cpf.replace(/\D/g, "");
  const { data: users } = await supabase.from("usuarios").select("*");
  const user = users?.find((u: { cpf: string }) => u.cpf.replace(/\D/g, "") === clean);

  if (!user) return { ok: false, erro: "Usuário não encontrado." };
  if (user.senha !== senhaAtual) return { ok: false, erro: "Senha atual incorreta." };
  if (novaSenha.length < 6) return { ok: false, erro: "Nova senha deve ter ao menos 6 caracteres." };

  await supabase.from("usuarios").update({ senha: novaSenha, primeiro_acesso: false }).eq("id", user.id);
  return { ok: true };
}

export async function isPrimeiroAcesso(identificador: string): Promise<boolean> {
  const digits = identificador.replace(/\D/g, "");

  if (digits.length >= 14) {
    const { data } = await supabase.from("lojas").select("primeiro_acesso, cnpj");
    const loja = data?.find((l: { cnpj: string }) => l.cnpj.replace(/\D/g, "") === digits);
    return (loja as { primeiro_acesso: boolean } | undefined)?.primeiro_acesso ?? false;
  }

  const { data } = await supabase.from("usuarios").select("primeiro_acesso, cpf");
  const user = data?.find((u: { cpf: string }) => u.cpf.replace(/\D/g, "") === digits);
  return (user as { primeiro_acesso: boolean } | undefined)?.primeiro_acesso ?? false;
}

// ─── CRUD Usuários ──────────────────────────────────────────

const SENHA_PADRAO = "gloja123";

export async function getUsuarios(): Promise<Usuario[]> {
  const lojaId = getLojaId();
  if (!lojaId) return [];
  const { data } = await supabase.from("usuarios").select("*").eq("loja_id", lojaId).order("criado_em", { ascending: false });
  return (data ?? []).map(mapUsuario);
}

export async function getUsuario(id: string): Promise<Usuario | undefined> {
  const { data } = await supabase.from("usuarios").select("*").eq("id", id).limit(1);
  return data?.[0] ? mapUsuario(data[0]) : undefined;
}

export async function criarUsuario(input: { cpf: string; nome: string; cargo: CargoSistema; senha?: string }): Promise<{ ok: true; usuario: Usuario } | { ok: false; erro: string }> {
  const lojaId = getLojaId();
  if (!lojaId) return { ok: false, erro: "Sessão inválida." };

  const clean = input.cpf.replace(/\D/g, "");
  const senhaFinal = input.senha?.trim() || SENHA_PADRAO;

  if (clean.length !== 11) return { ok: false, erro: "CPF deve ter 11 dígitos." };
  if (senhaFinal.length < 4) return { ok: false, erro: "Senha deve ter ao menos 4 caracteres." };

  const { data: existing } = await supabase.from("usuarios").select("id, cpf").eq("loja_id", lojaId);
  if (existing?.some((u: { cpf: string }) => u.cpf.replace(/\D/g, "") === clean)) {
    return { ok: false, erro: "Já existe um usuário com este CPF." };
  }

  const { data, error } = await supabase.from("usuarios").insert({
    loja_id: lojaId,
    cpf: formatCPF(clean),
    nome: input.nome,
    cargo: input.cargo,
    senha: senhaFinal,
    primeiro_acesso: true,
    ativo: true,
  }).select().single();

  if (error || !data) return { ok: false, erro: error?.message ?? "Erro ao criar usuário." };
  return { ok: true, usuario: mapUsuario(data) };
}

export async function atualizarUsuario(id: string, input: { nome?: string; cargo?: CargoSistema; ativo?: boolean }): Promise<Usuario | null> {
  const updates: Record<string, unknown> = {};
  if (input.nome !== undefined) updates.nome = input.nome;
  if (input.cargo !== undefined) updates.cargo = input.cargo;
  if (input.ativo !== undefined) updates.ativo = input.ativo;

  const { data } = await supabase.from("usuarios").update(updates).eq("id", id).select().single();
  return data ? mapUsuario(data) : null;
}

export async function resetarSenhaUsuario(id: string, novaSenha?: string): Promise<boolean> {
  const { error } = await supabase.from("usuarios").update({
    senha: novaSenha?.trim() || SENHA_PADRAO,
    primeiro_acesso: true,
  }).eq("id", id);
  return !error;
}

export async function excluirUsuario(id: string): Promise<boolean> {
  const { error } = await supabase.from("usuarios").delete().eq("id", id);
  return !error;
}

// ─── Mappers ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUsuario(row: any): Usuario {
  return {
    id: row.id,
    loja_id: row.loja_id,
    cpf: row.cpf,
    nome: row.nome,
    cargo: row.cargo,
    senha: row.senha,
    primeiroAcesso: row.primeiro_acesso,
    ativo: row.ativo,
    criadoEm: row.criado_em,
  };
}

// ─── Format helpers ─────────────────────────────────────────

export function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatIdentificador(value: string): string {
  const d = value.replace(/\D/g, "");
  if (d.length > 11) return formatCNPJ(value);
  return formatCPF(value);
}

export function getSenhaPadrao(): string {
  return SENHA_PADRAO;
}

// ─── Loja CRUD ──────────────────────────────────────────────

export async function getLojaAtual(): Promise<Loja | null> {
  const lojaId = getLojaId();
  if (!lojaId) return null;
  const { data } = await supabase.from("lojas").select("*").eq("id", lojaId).limit(1);
  return data?.[0] ?? null;
}

export async function atualizarLoja(id: string, input: { nome?: string; cnpj?: string; oriente?: string; nome_admin?: string }): Promise<{ ok: boolean; erro?: string }> {
  if (input.cnpj) {
    const clean = input.cnpj.replace(/\D/g, "");
    if (clean.length !== 14) return { ok: false, erro: "CNPJ deve ter 14 dígitos." };
    const { data: existing } = await supabase.from("lojas").select("id").eq("cnpj", formatCNPJ(clean));
    if (existing?.some((l: { id: string }) => l.id !== id)) {
      return { ok: false, erro: "Já existe uma loja com este CNPJ." };
    }
    input.cnpj = formatCNPJ(clean);
  }

  const { error } = await supabase.from("lojas").update(input).eq("id", id);
  if (error) return { ok: false, erro: error.message };

  const session = getSession();
  if (session && session.lojaId === id) {
    if (input.nome) session.nomeLoja = input.nome;
    if (input.oriente) session.oriente = input.oriente;
    if (input.nome_admin) session.nome = input.nome_admin;
    saveSession(session);
  }

  return { ok: true };
}

export async function cadastrarLoja(input: {
  cnpj: string;
  senha: string;
  nome: string;
  oriente: string;
  nomeAdmin: string;
}): Promise<{ ok: true; lojaId: string } | { ok: false; erro: string }> {
  const clean = input.cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return { ok: false, erro: "CNPJ deve ter 14 dígitos." };
  if (input.senha.length < 6) return { ok: false, erro: "Senha deve ter ao menos 6 caracteres." };
  if (!input.nome.trim()) return { ok: false, erro: "Nome da loja é obrigatório." };

  const { data: existing } = await supabase.from("lojas").select("id").eq("cnpj", formatCNPJ(clean));
  if (existing && existing.length > 0) {
    return { ok: false, erro: "Já existe uma loja com este CNPJ." };
  }

  const { data, error } = await supabase.from("lojas").insert({
    cnpj: formatCNPJ(clean),
    senha: input.senha,
    nome: input.nome.trim(),
    oriente: input.oriente.trim(),
    nome_admin: input.nomeAdmin.trim() || "Ven.·. Mestre",
    primeiro_acesso: false,
  }).select().single();

  if (error || !data) return { ok: false, erro: error?.message ?? "Erro ao cadastrar." };
  return { ok: true, lojaId: data.id };
}
