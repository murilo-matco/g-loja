"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  login,
  isLoggedIn,
  isPrimeiroAcesso,
  alterarSenhaLoja,
  alterarSenhaUsuario,
  cadastrarLoja,
  formatIdentificador,
  formatCNPJ,
} from "@/lib/auth-store";
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  UserCircle,
  ShieldCheck,
  KeyRound,
  CheckCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [modo, setModo] = useState<"login" | "cadastro">("login");

  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [showTrocaSenha, setShowTrocaSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaOriginal, setSenhaOriginal] = useState("");
  const [erroTroca, setErroTroca] = useState("");

  // Cadastro
  const [cadCnpj, setCadCnpj] = useState("");
  const [cadNome, setCadNome] = useState("");
  const [cadOriente, setCadOriente] = useState("");
  const [cadNomeAdmin, setCadNomeAdmin] = useState("");
  const [cadSenha, setCadSenha] = useState("");
  const [cadConfirmar, setCadConfirmar] = useState("");
  const [cadErro, setCadErro] = useState("");
  const [cadLoading, setCadLoading] = useState(false);
  const [cadSucesso, setCadSucesso] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) router.replace("/");
  }, [router]);

  function handleIdChange(value: string) {
    setIdentificador(formatIdentificador(value));
    setErro("");
  }

  const isCnpj = identificador.replace(/\D/g, "").length > 11;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const result = await login(identificador, senha);
    setLoading(false);

    if (!result.ok) {
      setErro(result.erro);
      return;
    }

    if (await isPrimeiroAcesso(identificador)) {
      setSenhaOriginal(senha);
      setShowTrocaSenha(true);
      return;
    }

    router.replace("/");
  }

  async function handleTrocarSenha() {
    setErroTroca("");

    if (novaSenha.length < 6) {
      setErroTroca("A nova senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroTroca("As senhas não coincidem.");
      return;
    }

    const result = isCnpj
      ? await alterarSenhaLoja(identificador, senhaOriginal, novaSenha)
      : await alterarSenhaUsuario(identificador, senhaOriginal, novaSenha);

    if (!result.ok) {
      setErroTroca(result.erro ?? "Erro ao alterar senha.");
      return;
    }

    setShowTrocaSenha(false);
    router.replace("/");
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setCadErro("");

    if (cadSenha.length < 6) {
      setCadErro("Senha deve ter ao menos 6 caracteres.");
      return;
    }
    if (cadSenha !== cadConfirmar) {
      setCadErro("As senhas não coincidem.");
      return;
    }

    setCadLoading(true);
    const result = await cadastrarLoja({
      cnpj: cadCnpj,
      senha: cadSenha,
      nome: cadNome,
      oriente: cadOriente,
      nomeAdmin: cadNomeAdmin,
    });
    setCadLoading(false);

    if (!result.ok) {
      setCadErro(result.erro);
      return;
    }

    setCadSucesso(true);
  }

  function voltarParaLogin() {
    setModo("login");
    setCadCnpj("");
    setCadNome("");
    setCadOriente("");
    setCadNomeAdmin("");
    setCadSenha("");
    setCadConfirmar("");
    setCadErro("");
    setCadSucesso(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-900 font-bold text-2xl shadow-xl">
            G
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">G-Loja</h1>
        <p className="text-sm text-slate-400 mt-1">Sistema de Gestão para Lojas Maçônicas</p>
      </div>

      {/* ── LOGIN ── */}
      {modo === "login" && (
        <Card className="relative z-10 w-full max-w-md shadow-2xl border-slate-700/50 bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center gap-2 text-slate-300 mb-1">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium">Acesso Restrito</span>
            </div>
            <p className="text-xs text-slate-500">
              Entre com o CNPJ da Loja (Venerável) ou seu CPF (demais cargos).
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identificador" className="text-slate-300 text-sm">CPF ou CNPJ</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="identificador"
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    value={identificador}
                    onChange={(e) => handleIdChange(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    autoComplete="off"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {isCnpj ? "Modo: Venerável Mestre (CNPJ)" : "Modo: Irmão (CPF)"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha" className="text-slate-300 text-sm">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="senha"
                    type={showSenha ? "text" : "password"}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => { setSenha(e.target.value); setErro(""); }}
                    className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    onClick={() => setShowSenha((s) => !s)}
                    tabIndex={-1}
                  >
                    {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {erro && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                  {erro}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-11 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-700/50 text-center">
              <p className="text-xs text-slate-500 mb-3">Ainda não tem uma loja cadastrada?</p>
              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white gap-2"
                onClick={() => setModo("cadastro")}
              >
                <Building2 className="h-4 w-4" />
                Cadastrar Nova Loja
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── CADASTRO DE NOVA LOJA ── */}
      {modo === "cadastro" && (
        <Card className="relative z-10 w-full max-w-md shadow-2xl border-slate-700/50 bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4 pt-6 px-6">
            <button
              onClick={voltarParaLogin}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para login
            </button>
            <div className="flex items-center gap-2 text-slate-300 mb-1">
              <Building2 className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium">Cadastrar Nova Loja</span>
            </div>
            <p className="text-xs text-slate-500">
              Cada loja é uma licença independente com seus próprios dados.
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {cadSucesso ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-semibold text-white">Loja Cadastrada!</h3>
                <p className="text-sm text-slate-400">
                  Agora você pode fazer login com o CNPJ e a senha que acabou de criar.
                </p>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={voltarParaLogin}
                >
                  Ir para Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCadastro} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cad-cnpj" className="text-slate-300 text-sm">CNPJ da Loja *</Label>
                  <Input
                    id="cad-cnpj"
                    required
                    placeholder="00.000.000/0001-00"
                    value={cadCnpj}
                    onChange={(e) => setCadCnpj(formatCNPJ(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cad-nome" className="text-slate-300 text-sm">Nome da Loja *</Label>
                  <Input
                    id="cad-nome"
                    required
                    placeholder="Ex: Loja Fraternidade nº 123"
                    value={cadNome}
                    onChange={(e) => setCadNome(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cad-oriente" className="text-slate-300 text-sm">Oriente</Label>
                  <Input
                    id="cad-oriente"
                    placeholder="Ex: Oriente de São Paulo — GOB"
                    value={cadOriente}
                    onChange={(e) => setCadOriente(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cad-admin" className="text-slate-300 text-sm">Nome do Venerável</Label>
                  <Input
                    id="cad-admin"
                    placeholder="Ex: José Carlos Almeida"
                    value={cadNomeAdmin}
                    onChange={(e) => setCadNomeAdmin(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cad-senha" className="text-slate-300 text-sm">Senha *</Label>
                    <Input
                      id="cad-senha"
                      type="password"
                      required
                      placeholder="Min. 6 caracteres"
                      value={cadSenha}
                      onChange={(e) => { setCadSenha(e.target.value); setCadErro(""); }}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cad-confirmar" className="text-slate-300 text-sm">Confirmar *</Label>
                    <Input
                      id="cad-confirmar"
                      type="password"
                      required
                      placeholder="Repita a senha"
                      value={cadConfirmar}
                      onChange={(e) => { setCadConfirmar(e.target.value); setCadErro(""); }}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {cadErro && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                    {cadErro}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-11 mt-2"
                  disabled={cadLoading}
                >
                  {cadLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Cadastrando...
                    </>
                  ) : (
                    "Cadastrar Loja"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <p className="relative z-10 mt-8 text-xs text-slate-600">
        G-Loja © {new Date().getFullYear()} — Todos os direitos reservados
      </p>

      {/* Dialog: Primeiro Acesso */}
      <Dialog open={showTrocaSenha} onOpenChange={setShowTrocaSenha}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <KeyRound className="h-5 w-5 text-emerald-400" />
              Primeiro Acesso — Criar Senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-400">
              Por segurança, crie uma nova senha para acessar o sistema.
            </p>
            <div className="space-y-2">
              <Label htmlFor="nova-senha" className="text-slate-300">Nova Senha</Label>
              <Input
                id="nova-senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={novaSenha}
                onChange={(e) => { setNovaSenha(e.target.value); setErroTroca(""); }}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar-senha" className="text-slate-300">Confirmar Senha</Label>
              <Input
                id="confirmar-senha"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmarSenha}
                onChange={(e) => { setConfirmarSenha(e.target.value); setErroTroca(""); }}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            {erroTroca && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                {erroTroca}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleTrocarSenha}
            >
              Salvar e Entrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
