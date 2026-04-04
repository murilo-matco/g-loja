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
  formatIdentificador,
} from "@/lib/auth-store";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  UserCircle,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  // Primeiro acesso — troca de senha
  const [showTrocaSenha, setShowTrocaSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaOriginal, setSenhaOriginal] = useState("");
  const [erroTroca, setErroTroca] = useState("");

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      {/* Background pattern */}
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

      {/* Login Card */}
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
            {/* Identificador — CPF ou CNPJ */}
            <div className="space-y-2">
              <Label htmlFor="identificador" className="text-slate-300 text-sm">
                CPF ou CNPJ
              </Label>
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

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-slate-300 text-sm">
                Senha
              </Label>
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

            {/* Erro */}
            {erro && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
                {erro}
              </div>
            )}

            {/* Submit */}
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

          {/* Dica */}
          <div className="mt-6 rounded-lg bg-slate-700/40 border border-slate-600/50 px-4 py-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Venerável Mestre?</span>{" "}
              Use o CNPJ da Loja + senha fornecida pela equipe G-Loja.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed mt-1.5">
              <span className="font-semibold text-slate-300">Demais Irmãos?</span>{" "}
              Use seu CPF + senha fornecida pelo Venerável.
              No primeiro acesso, você criará uma nova senha.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-xs text-slate-600">
        G-Loja © {new Date().getFullYear()} — Todos os direitos reservados
      </p>

      {/* ── Dialog: Primeiro Acesso — Trocar Senha ── */}
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
