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
  limit,
  serverTimestamp,
} from "firebase/firestore";

const SESSION_KEY = "gloja-auth";

// ─── Cargos com acesso ao sistema ───────────────────────────

export type CargoSistema =
  | "VENERAVEL"
  | "CHANCELER"
  | "TESOUREIRO"
  | "SECRETARIO"
  | "ORADOR"
  | "PRIMEIRO_VIGILANTE"
  | "SEGUNDO_VIGILANTE"
  | "MEMBRO";

export const CARGO_SISTEMA_LABELS: Record<CargoSistema, string> = {
  VENERAVEL: "Venerável Mestre",
  CHANCELER: "Chanceler",
  TESOUREIRO: "Tesoureiro",
  SECRETARIO: "Secretário",
  ORADOR: "Orador",
  PRIMEIRO_VIGILANTE: "1º Vigilante",
  SEGUNDO_VIGILANTE: "2º Vigilante",
  MEMBRO: "Irmão (acesso aos trabalhos)",
};

export const PERMISSOES: Record<CargoSistema, string[]> = {
  VENERAVEL: ["/app", "/app/irmaos", "/app/sessoes", "/app/presenca", "/app/acoes", "/app/trabalhos", "/app/financeiro", "/app/relatorios", "/app/configuracoes"],
  CHANCELER: ["/app", "/app/presenca", "/app/acoes", "/app/trabalhos"],
  TESOUREIRO: ["/app", "/app/financeiro"],
  SECRETARIO: ["/app", "/app/irmaos", "/app/sessoes", "/app/acoes", "/app/trabalhos", "/app/relatorios"],
  ORADOR: ["/app", "/app/sessoes", "/app/acoes", "/app/trabalhos", "/app/relatorios"],
  PRIMEIRO_VIGILANTE: ["/app", "/app/irmaos", "/app/sessoes", "/app/presenca", "/app/acoes", "/app/trabalhos", "/app/relatorios"],
  SEGUNDO_VIGILANTE: ["/app", "/app/sessoes", "/app/presenca", "/app/acoes", "/app/trabalhos"],
  /** Irmão comum: só biblioteca de trabalhos (por grau). */
  MEMBRO: ["/app/trabalhos"],
};

/** Destino após login conforme o cargo. */
export function homePathForCargo(cargo: CargoSistema): string {
  if (cargo === "MEMBRO") return "/app/trabalhos";
  return "/app";
}

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
  /** 1=Aprendiz, 2=Companheiro, 3=Mestre — usado em Trabalhos */
  grauNivel?: number;
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
    if (p === "/app") return rota === "/app" || rota === "/app/";
    return rota === p || rota.startsWith(p + "/");
  });
}

export function isAdmin(): boolean {
  return getSession()?.cargo === "VENERAVEL";
}

// ─── Helpers ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tsToString(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "string") return ts;
  if (ts.toDate) return ts.toDate().toISOString();
  return new Date().toISOString();
}

// ─── Login (async — queries Firestore) ───────────────────────

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
  const snap = await getDocs(collection(db, "lojas"));
  const loja = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Loja))
    .find((l) => l.cnpj.replace(/\D/g, "") === clean);

  if (!loja) return { ok: false, erro: "CNPJ não cadastrado no sistema." };
  if (loja.senha !== senha) return { ok: false, erro: "Senha incorreta." };

  const session: AuthSession = {
    tipo: "loja",
    id: loja.id,
    lojaId: loja.id,
    cnpj: loja.cnpj,
    nome: loja.nome_admin,
    cargo: "VENERAVEL",
    grauNivel: 3,
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
  const snap = await getDocs(collection(db, "usuarios"));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allUsers = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
  const user = allUsers.find((u: { cpf?: string }) => u.cpf?.replace(/\D/g, "") === clean);

  if (!user) return { ok: false, erro: "CPF não cadastrado no sistema." };
  if (!user.ativo) return { ok: false, erro: "Acesso desativado. Contate o Venerável." };
  if (user.senha !== senha) return { ok: false, erro: "Senha incorreta." };

  let nomeLoja = "G-Loja";
  let oriente = "";
  if (user.loja_id) {
    const lojaSnap = await getDoc(doc(db, "lojas", user.loja_id as string));
    if (lojaSnap.exists()) {
      const lojaData = lojaSnap.data();
      nomeLoja = lojaData.nome ?? nomeLoja;
      oriente = lojaData.oriente ?? "";
    }
  }

  let grauNivel = 1;
  try {
    const irmaosSnap = await getDocs(
      query(collection(db, "irmaos"), where("loja_id", "==", user.loja_id as string))
    );
    const irmao = irmaosSnap.docs
      .map((d) => d.data())
      .find((i) => (i.cpf as string | undefined)?.replace(/\D/g, "") === clean);
    const grau = (irmao?.grau as string) ?? "APRENDIZ";
    grauNivel = grau === "MESTRE" ? 3 : grau === "COMPANHEIRO" ? 2 : 1;
  } catch {
    grauNivel = 1;
  }

  const session: AuthSession = {
    tipo: "usuario",
    id: user.id,
    lojaId: user.loja_id as string,
    cpf: user.cpf as string,
    nome: user.nome as string,
    cargo: user.cargo as CargoSistema,
    grauNivel,
    nomeLoja,
    oriente,
    permissoes: PERMISSOES[user.cargo as CargoSistema] ?? ["/app"],
    logadoEm: new Date().toISOString(),
  };
  saveSession(session);
  return { ok: true, session };
}

// ─── Alterar senha ──────────────────────────────────────────

export async function alterarSenhaLoja(cnpj: string, senhaAtual: string, novaSenha: string): Promise<{ ok: boolean; erro?: string }> {
  const clean = cnpj.replace(/\D/g, "");
  const snap = await getDocs(collection(db, "lojas"));
  const lojaDoc = snap.docs.find((d) => (d.data().cnpj ?? "").replace(/\D/g, "") === clean);

  if (!lojaDoc) return { ok: false, erro: "Loja não encontrada." };
  if (lojaDoc.data().senha !== senhaAtual) return { ok: false, erro: "Senha atual incorreta." };
  if (novaSenha.length < 6) return { ok: false, erro: "Nova senha deve ter ao menos 6 caracteres." };

  await updateDoc(doc(db, "lojas", lojaDoc.id), { senha: novaSenha, primeiro_acesso: false });
  return { ok: true };
}

export async function alterarSenhaUsuario(cpf: string, senhaAtual: string, novaSenha: string): Promise<{ ok: boolean; erro?: string }> {
  const clean = cpf.replace(/\D/g, "");
  const snap = await getDocs(collection(db, "usuarios"));
  const userDoc = snap.docs.find((d) => (d.data().cpf ?? "").replace(/\D/g, "") === clean);

  if (!userDoc) return { ok: false, erro: "Usuário não encontrado." };
  if (userDoc.data().senha !== senhaAtual) return { ok: false, erro: "Senha atual incorreta." };
  if (novaSenha.length < 6) return { ok: false, erro: "Nova senha deve ter ao menos 6 caracteres." };

  await updateDoc(doc(db, "usuarios", userDoc.id), { senha: novaSenha, primeiro_acesso: false });
  return { ok: true };
}

export async function isPrimeiroAcesso(identificador: string): Promise<boolean> {
  const digits = identificador.replace(/\D/g, "");

  if (digits.length >= 14) {
    const snap = await getDocs(collection(db, "lojas"));
    const lojaDoc = snap.docs.find((d) => (d.data().cnpj ?? "").replace(/\D/g, "") === digits);
    return lojaDoc?.data().primeiro_acesso ?? false;
  }

  const snap = await getDocs(collection(db, "usuarios"));
  const userDoc = snap.docs.find((d) => (d.data().cpf ?? "").replace(/\D/g, "") === digits);
  return userDoc?.data().primeiro_acesso ?? false;
}

// ─── CRUD Usuários ──────────────────────────────────────────

const SENHA_PADRAO = "gloja123";

export async function getUsuarios(): Promise<Usuario[]> {
  const lojaId = getLojaId();
  if (!lojaId) return [];
  const q = query(collection(db, "usuarios"), where("loja_id", "==", lojaId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapUsuario({ id: d.id, ...d.data() }));
}

export async function getUsuario(id: string): Promise<Usuario | undefined> {
  const snap = await getDoc(doc(db, "usuarios", id));
  if (!snap.exists()) return undefined;
  return mapUsuario({ id: snap.id, ...snap.data() });
}

export async function criarUsuario(input: { cpf: string; nome: string; cargo: CargoSistema; senha?: string }): Promise<{ ok: true; usuario: Usuario } | { ok: false; erro: string }> {
  const lojaId = getLojaId();
  if (!lojaId) return { ok: false, erro: "Sessão inválida." };

  const clean = input.cpf.replace(/\D/g, "");
  const senhaFinal = input.senha?.trim() || SENHA_PADRAO;

  if (clean.length !== 11) return { ok: false, erro: "CPF deve ter 11 dígitos." };
  if (senhaFinal.length < 4) return { ok: false, erro: "Senha deve ter ao menos 4 caracteres." };

  const q = query(collection(db, "usuarios"), where("loja_id", "==", lojaId));
  const existing = await getDocs(q);
  if (existing.docs.some((d) => (d.data().cpf ?? "").replace(/\D/g, "") === clean)) {
    return { ok: false, erro: "Já existe um usuário com este CPF." };
  }

  const ref = await addDoc(collection(db, "usuarios"), {
    loja_id: lojaId,
    cpf: formatCPF(clean),
    nome: input.nome,
    cargo: input.cargo,
    senha: senhaFinal,
    primeiro_acesso: true,
    ativo: true,
    criado_em: serverTimestamp(),
  });

  const snap = await getDoc(ref);
  return { ok: true, usuario: mapUsuario({ id: snap.id, ...snap.data() }) };
}

export async function atualizarUsuario(id: string, input: { nome?: string; cargo?: CargoSistema; ativo?: boolean }): Promise<Usuario | null> {
  const updates: Record<string, unknown> = {};
  if (input.nome !== undefined) updates.nome = input.nome;
  if (input.cargo !== undefined) updates.cargo = input.cargo;
  if (input.ativo !== undefined) updates.ativo = input.ativo;

  await updateDoc(doc(db, "usuarios", id), updates);
  const snap = await getDoc(doc(db, "usuarios", id));
  return snap.exists() ? mapUsuario({ id: snap.id, ...snap.data() }) : null;
}

export async function resetarSenhaUsuario(id: string, novaSenha?: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, "usuarios", id), {
      senha: novaSenha?.trim() || SENHA_PADRAO,
      primeiro_acesso: true,
    });
    return true;
  } catch {
    return false;
  }
}

export async function excluirUsuario(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "usuarios", id));
    return true;
  } catch {
    return false;
  }
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
    criadoEm: tsToString(row.criado_em),
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
  const snap = await getDoc(doc(db, "lojas", lojaId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    cnpj: data.cnpj,
    senha: data.senha,
    nome: data.nome,
    oriente: data.oriente ?? "",
    nome_admin: data.nome_admin ?? "",
    primeiro_acesso: data.primeiro_acesso ?? false,
    criado_em: tsToString(data.criado_em),
  };
}

export async function atualizarLoja(id: string, input: { nome?: string; cnpj?: string; oriente?: string; nome_admin?: string }): Promise<{ ok: boolean; erro?: string }> {
  if (input.cnpj) {
    const clean = input.cnpj.replace(/\D/g, "");
    if (clean.length !== 14) return { ok: false, erro: "CNPJ deve ter 14 dígitos." };
    const snap = await getDocs(collection(db, "lojas"));
    const conflict = snap.docs.find((d) => d.data().cnpj === formatCNPJ(clean) && d.id !== id);
    if (conflict) return { ok: false, erro: "Já existe uma loja com este CNPJ." };
    input.cnpj = formatCNPJ(clean);
  }

  try {
    await updateDoc(doc(db, "lojas", id), { ...input });
  } catch (e) {
    return { ok: false, erro: (e as Error).message };
  }

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

  const snap = await getDocs(collection(db, "lojas"));
  const conflict = snap.docs.find((d) => d.data().cnpj === formatCNPJ(clean));
  if (conflict) return { ok: false, erro: "Já existe uma loja com este CNPJ." };

  const ref = await addDoc(collection(db, "lojas"), {
    cnpj: formatCNPJ(clean),
    senha: input.senha,
    nome: input.nome.trim(),
    oriente: input.oriente.trim(),
    nome_admin: input.nomeAdmin.trim() || "Ven.·. Mestre",
    primeiro_acesso: false,
    criado_em: serverTimestamp(),
  });

  return { ok: true, lojaId: ref.id };
}
