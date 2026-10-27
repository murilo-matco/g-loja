"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TIPO_SESSAO_LABELS, STATUS_SESSAO_LABELS } from "@/lib/constants";
import {
  Users,
  CalendarDays,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  ClipboardCheck,
  Loader2,
  CalendarClock,
} from "lucide-react";
import { getIrmaos } from "@/lib/irmaos-store";
import { getSessoes, type SessaoStore, type TipoSessao } from "@/lib/presenca-store";
import { getTransacoes } from "@/lib/financeiro-store";

// ─── Helpers ────────────────────────────────────────────────

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDateShort(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(y, m - 1, d));
}

function formatWeekday(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(new Date(y, m - 1, d));
}

function tipoBadgeVariant(tipo: TipoSessao): "default" | "secondary" | "outline" {
  switch (tipo) {
    case "MAGNA": return "default";
    case "ORDINARIA":
    case "BRANCA": return "secondary";
    default: return "outline";
  }
}

// ─── Component ──────────────────────────────────────────────

export default function DashboardPage() {
  const [loaded, setLoaded] = useState(false);
  const [totalAtivos, setTotalAtivos] = useState(0);
  const [totalAdormecidos, setTotalAdormecidos] = useState(0);
  const [proximasSessoes, setProximasSessoes] = useState<SessaoStore[]>([]);
  const [proximaSessao, setProximaSessao] = useState<SessaoStore | null>(null);
  const [receitasMes, setReceitasMes] = useState(0);
  const [despesasMes, setDespesasMes] = useState(0);

  useEffect(() => {
    async function loadData() {
      const hoje = todayISO();
      const [anoHoje, mesHoje] = hoje.split("-").map(Number);

      // Irmãos
      const irmaos = await getIrmaos();
      setTotalAtivos(irmaos.filter((i) => i.status === "ATIVO").length);
      setTotalAdormecidos(irmaos.filter((i) => i.status === "ADORMECIDO").length);

      // Sessões futuras (data > hoje) ordenadas por data crescente
      const sessoes = await getSessoes();
      const futuras = sessoes
        .filter((s) => s.data > hoje)
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      setProximasSessoes(futuras.slice(0, 5));
      setProximaSessao(futuras[0] ?? null);

      // Finanças do mês atual
      const transacoes = await getTransacoes();
      const doMes = transacoes.filter((t) => {
        const [y, m] = t.vencimento.split("-").map(Number);
        return y === anoHoje && m === mesHoje;
      });
      setReceitasMes(doMes.filter((t) => t.tipo === "RECEITA").reduce((s, t) => s + t.valor, 0));
      setDespesasMes(doMes.filter((t) => t.tipo === "DESPESA").reduce((s, t) => s + t.valor, 0));

      setLoaded(true);
    }
    loadData();
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const saldo = receitasMes - despesasMes;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumo geral da Loja
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Irmãos Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">{totalAtivos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalAdormecidos > 0 ? `${totalAdormecidos} adormecido${totalAdormecidos !== 1 ? "s" : ""}` : "Todos ativos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próxima Sessão</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {proximaSessao ? (
              <>
                <div className="text-lg md:text-2xl font-bold">{formatDateShort(proximaSessao.data)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {TIPO_SESSAO_LABELS[proximaSessao.tipo]} — <span className="capitalize">{formatWeekday(proximaSessao.data)}</span>
                </p>
              </>
            ) : (
              <>
                <div className="text-lg md:text-2xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground mt-1">Nenhuma sessão futura</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receitas (Mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-emerald-600 dark:text-emerald-500 tabular-nums">
              {formatBRL(receitasMes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Arrecadação do período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas (Mês)</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold text-red-600 dark:text-red-500 tabular-nums">
              {formatBRL(despesasMes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saldo:{" "}
              <span className={cn("font-semibold", saldo >= 0 ? "text-blue-600" : "text-red-600")}>
                {formatBRL(saldo)}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Próximas Sessões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Próximas Sessões
            </CardTitle>
            <CardDescription>Calendário das próximas reuniões agendadas</CardDescription>
          </CardHeader>
          <CardContent>
            {proximasSessoes.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <CalendarClock className="h-10 w-10 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhuma sessão futura cadastrada.</p>
                <Link href="/app/sessoes" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
                  <CalendarDays className="h-4 w-4" />
                  Ir para Sessões
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {proximasSessoes.map((sessao) => (
                  <div
                    key={sessao.id}
                    className="flex items-center justify-between py-2.5 border-b last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize">{formatDateShort(sessao.data)}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {formatWeekday(sessao.data)}
                        {sessao.tema && <span> — {sessao.tema}</span>}
                      </p>
                    </div>
                    <Badge variant={tipoBadgeVariant(sessao.tipo)} className="shrink-0 ml-2">
                      {TIPO_SESSAO_LABELS[sessao.tipo]}
                    </Badge>
                  </div>
                ))}
                {proximasSessoes.length >= 5 && (
                  <Link href="/app/sessoes" className="block text-center text-xs text-primary hover:underline pt-2">
                    Ver todas as sessões
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acesso rápido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Acesso Rápido
            </CardTitle>
            <CardDescription>Atalhos para as principais funções</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/app/irmaos"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start gap-2")}
            >
              <Users className="h-4 w-4" />
              Gerenciar Irmãos
            </Link>
            <Link
              href="/app/presenca"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start gap-2")}
            >
              <ClipboardCheck className="h-4 w-4" />
              Chancelaria — Presença
            </Link>
            <Link
              href="/app/financeiro"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start gap-2")}
            >
              <Wallet className="h-4 w-4" />
              Financeiro
            </Link>
            <Link
              href="/app/sessoes"
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start gap-2")}
            >
              <CalendarDays className="h-4 w-4" />
              Sessões
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
