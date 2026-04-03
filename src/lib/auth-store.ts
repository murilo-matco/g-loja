const SESSION_KEY = "gloja-auth";
const LOJAS_KEY = "gloja-lojas";
const USERS_KEY = "gloja-usuarios";

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

// Rotas permitidas por cargo (VENERAVEL tem acesso total)
export const PERMISSOES: Record<CargoSistema, string[]> = {
  VENERAVEL: ["/", "/irmaos", "/sessoes", "/presenca", "/financeiro", "/relatorios"],
  CHANCELER: ["/", "/presenca"],
  TESOUREIRO: ["/", "/financeiro"],
  SECRETARIO: ["/", "/irmaos", "/sessoes", "/relatorios"],
  ORADOR: ["/", "/sessoes", "/relatorios"],
  PRIMEIRO_VIGILANTE: ["/", "/irmaos", "/sessoes", "/presenca", "/relatorios"],
  SEGUNDO_VIGILANTE: ["/", "/sessoes", "/presenca"],
};

// ─── Types ──────────────────────────────────────────────────

export interface Loja {
  cnpj: string;
  senha: string;
  nome: string;
  oriente: string;
  nomeAdmin: string;
  primeiroAcesso: boolean;
  criadoEm: string;
}

export interface Usuario {
  id: string;
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
  cnpj?: string;
  cpf?: string;
  nome: string;
  cargo: CargoSistema;
  nomeLoja: string;
  oriente: string;
  permissoes: string[];
  logadoEm: string;
}

// ─── Loja (admin / CNPJ) ───────────────────────────────────

const LOJA_DEMO: Loja = {
  cnpj: "00.000.000/0001-00",
  senha: "gloja2026",
  nome: "Loja Estrela do Oriente nº 001",
  oriente: "Oriente de São Paulo — GOB",
  nomeAdmin: "Ven.·. Mestre",
  primeiroAcesso: true,
  criadoEm: new Date().toISOString(),
};

function getLojas(): Loja[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LOJAS_KEY);
  if (!raw) {
    localStorage.setItem(LOJAS_KEY, JSON.stringify([LOJA_DEMO]));
    return [LOJA_DEMO];
  }
  try { return JSON.parse(raw); }
  catch { return []; }
}

function saveLojas(lojas: Loja[]) {
  localStorage.setItem(LOJAS_KEY, JSON.stringify(lojas));
}

function findLoja(cnpj: string): Loja | undefined {
  const clean = cnpj.replace(/\D/g, "");
  return getLojas().find((l) => l.cnpj.replace(/\D/g, "") === clean);
}

// ─── Usuários (CPF) ────────────────────────────────────────

function loadUsuarios(): Usuario[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); }
  catch { return []; }
}

function saveUsuarios(users: Usuario[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUsuario(cpf: string): Usuario | undefined {
  const clean = cpf.replace(/\D/g, "");
  return loadUsuarios().find((u) => u.cpf.replace(/\D/g, "") === clean);
}

// ─── Login ──────────────────────────────────────────────────

export function login(
  identificador: string,
  senha: string
): { ok: true; session: AuthSession } | { ok: false; erro: string } {
  const digits = identificador.replace(/\D/g, "");

  // CNPJ = 14 dígitos, CPF = 11 dígitos
  if (digits.length >= 14) {
    return loginLoja(identificador, senha);
  }
  if (digits.length === 11) {
    return loginUsuario(identificador, senha);
  }

  // Tenta ambos
  const tentaLoja = loginLoja(identificador, senha);
  if (tentaLoja.ok) return tentaLoja;
  const tentaUser = loginUsuario(identificador, senha);
  if (tentaUser.ok) return tentaUser;

  return { ok: false, erro: "CPF ou CNPJ não encontrado no sistema." };
}

function loginLoja(cnpj: string, senha: string): { ok: true; session: AuthSession } | { ok: false; erro: string } {
  const loja = findLoja(cnpj);
  if (!loja) return { ok: false, erro: "CNPJ não cadastrado no sistema." };
  if (loja.senha !== senha) return { ok: false, erro: "Senha incorreta." };

  const session: AuthSession = {
    tipo: "loja",
    id: loja.cnpj,
    cnpj: loja.cnpj,
    nome: loja.nomeAdmin,
    cargo: "VENERAVEL",
    nomeLoja: loja.nome,
    oriente: loja.oriente,
    permissoes: PERMISSOES.VENERAVEL,
    logadoEm: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, session };
}

function loginUsuario(cpf: string, senha: string): { ok: true; session: AuthSession } | { ok: false; erro: string } {
  const user = findUsuario(cpf);
  if (!user) return { ok: false, erro: "CPF não cadastrado no sistema." };
  if (!user.ativo) return { ok: false, erro: "Acesso desativado. Contate o Venerável." };
  if (user.senha !== senha) return { ok: false, erro: "Senha incorreta." };

  const loja = getLojas()[0];

  const session: AuthSession = {
    tipo: "usuario",
    id: user.id,
    cpf: user.cpf,
    nome: user.nome,
    cargo: user.cargo,
    nomeLoja: loja?.nome ?? "G-Loja",
    oriente: loja?.oriente ?? "",
    permissoes: PERMISSOES[user.cargo] ?? ["/"],
    logadoEm: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { ok: true, session };
}

// ─── Session ────────────────────────────────────────────────

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Invalida sessões do formato antigo (sem cargo/permissoes)
    if (!parsed.cargo || !Array.isArray(parsed.permissoes)) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
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
  const session = getSession();
  return session?.cargo === "VENERAVEL";
}

// ─── Alterar senha (Loja / CNPJ) ───────────────────────────

export function alterarSenhaLoja(cnpj: string, senhaAtual: string, novaSenha: string): { ok: boolean; erro?: string } {
  const lojas = getLojas();
  const clean = cnpj.replace(/\D/g, "");
  const idx = lojas.findIndex((l) => l.cnpj.replace(/\D/g, "") === clean);
  if (idx === -1) return { ok: false, erro: "Loja não encontrada." };
  if (lojas[idx].senha !== senhaAtual) return { ok: false, erro: "Senha atual incorreta." };
  if (novaSenha.length < 6) return { ok: false, erro: "Nova senha deve ter ao menos 6 caracteres." };

  lojas[idx].senha = novaSenha;
  lojas[idx].primeiroAcesso = false;
  saveLojas(lojas);
  return { ok: true };
}

// ─── Alterar senha (Usuário / CPF) ─────────────────────────

export function alterarSenhaUsuario(cpf: string, senhaAtual: string, novaSenha: string): { ok: boolean; erro?: string } {
  const users = loadUsuarios();
  const clean = cpf.replace(/\D/g, "");
  const idx = users.findIndex((u) => u.cpf.replace(/\D/g, "") === clean);
  if (idx === -1) return { ok: false, erro: "Usuário não encontrado." };
  if (users[idx].senha !== senhaAtual) return { ok: false, erro: "Senha atual incorreta." };
  if (novaSenha.length < 6) return { ok: false, erro: "Nova senha deve ter ao menos 6 caracteres." };

  users[idx].senha = novaSenha;
  users[idx].primeiroAcesso = false;
  saveUsuarios(users);
  return { ok: true };
}

export function isPrimeiroAcesso(identificador: string): boolean {
  const digits = identificador.replace(/\D/g, "");
  if (digits.length >= 14) {
    const loja = findLoja(identificador);
    return loja?.primeiroAcesso ?? false;
  }
  const user = findUsuario(identificador);
  return user?.primeiroAcesso ?? false;
}

// ─── CRUD Usuários (só o Ven Mestre usa) ────────────────────

const SENHA_PADRAO = "gloja123";

export function getUsuarios(): Usuario[] {
  return loadUsuarios();
}

export function getUsuario(id: string): Usuario | undefined {
  return loadUsuarios().find((u) => u.id === id);
}

export function criarUsuario(data: { cpf: string; nome: string; cargo: CargoSistema; senha?: string }): { ok: true; usuario: Usuario } | { ok: false; erro: string } {
  const users = loadUsuarios();
  const clean = data.cpf.replace(/\D/g, "");
  const senhaFinal = data.senha?.trim() || SENHA_PADRAO;

  if (clean.length !== 11) return { ok: false, erro: "CPF deve ter 11 dígitos." };
  if (senhaFinal.length < 4) return { ok: false, erro: "Senha deve ter ao menos 4 caracteres." };
  if (users.some((u) => u.cpf.replace(/\D/g, "") === clean)) {
    return { ok: false, erro: "Já existe um usuário com este CPF." };
  }

  const novo: Usuario = {
    id: `usr-${Date.now()}`,
    cpf: formatCPF(clean),
    nome: data.nome,
    cargo: data.cargo,
    senha: senhaFinal,
    primeiroAcesso: true,
    ativo: true,
    criadoEm: new Date().toISOString(),
  };
  users.push(novo);
  saveUsuarios(users);
  return { ok: true, usuario: novo };
}

export function atualizarUsuario(id: string, data: { nome?: string; cargo?: CargoSistema; ativo?: boolean }): Usuario | null {
  const users = loadUsuarios();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  if (data.nome !== undefined) users[idx].nome = data.nome;
  if (data.cargo !== undefined) users[idx].cargo = data.cargo;
  if (data.ativo !== undefined) users[idx].ativo = data.ativo;
  saveUsuarios(users);
  return users[idx];
}

export function resetarSenhaUsuario(id: string, novaSenha?: string): boolean {
  const users = loadUsuarios();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  users[idx].senha = novaSenha?.trim() || SENHA_PADRAO;
  users[idx].primeiroAcesso = true;
  saveUsuarios(users);
  return true;
}

export function excluirUsuario(id: string): boolean {
  const users = loadUsuarios();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  users.splice(idx, 1);
  saveUsuarios(users);
  return true;
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
