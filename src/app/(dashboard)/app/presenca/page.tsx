"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  TIPO_SESSAO_LABELS,
  STATUS_SESSAO_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  CalendarDays,
  CalendarClock,
  Users,
  Lock,
  CircleDot,
  FileEdit,
  Loader2,
} from "lucide-react";
import {
  getSessoes,
  getResumoPresenca,
  type SessaoStore,
  type TipoSessao,
  type StatusSessao,
} from "@/lib/presenca-store";

// ─── Helpers ────────────────────────────────────────────────

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function statusBadge(status: StatusSessao) {
  switch (status) {
    case "RASCUNHO":
      return (
        <Badge variant="secondary" className="gap-1">
          <FileEdit className="h-3 w-3" />
          {STATUS_SESSAO_LABELS.RASCUNHO}
        </Badge>
      );
    case "ABERTA":
      return (
        <Badge className="gap-1 bg-amber-500/15 text-amber-700 border-amber-500/30 hover:bg-amber-500/20 dark:text-amber-400">
          <CircleDot className="h-3 w-3" />
          {STATUS_SESSAO_LABELS.ABERTA}
        </Badge>
      );
    case "CONCLUIDA":
      return (
        <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-400">
          <Lock className="h-3 w-3" />
          {STATUS_SESSAO_LABELS.CONCLUIDA}
        </Badge>
      );
  }
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

type SessaoEnriquecida = SessaoStore & { presentes: number; total: number; passada: boolean };

export default function PresencaPage() {
  const [sessoes, setSessoes] = useState<SessaoEnriquecida[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const hoje = todayISO();
      const raw = await getSessoes();
      const enriched: SessaoEnriquecida[] = [];
      for (const s of raw) {
        const resumo = await getResumoPresenca(s.id);
        enriched.push({ ...s, presentes: resumo.presentes, total: resumo.total, passada: s.data <= hoje });
      }
      enriched.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      setSessoes(enriched);
      setLoading(false);
    }
    load();
  }, []);

  const sessoesPassadas = sessoes.filter((s) => s.passada);
  const sessoesFuturas = sessoes.filter((s) => !s.passada);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardCheck className="h-7 w-7 text-primary" />
          Chancelaria — Presença
        </h1>
        <p className="text-muted-foreground mt-1">
          Controle de presença dos Irmãos. As sessões são cadastradas na aba <strong>Sessões</strong> e aparecem aqui quando a data já passou.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FileEdit className="h-3.5 w-3.5" /> Aguardando chamada
        </span>
        <span className="flex items-center gap-1.5">
          <CircleDot className="h-3.5 w-3.5 text-amber-600" /> Presença em andamento
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-emerald-600" /> Presença finalizada
        </span>
      </div>

      {sessoes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhuma sessão cadastrada ainda.</p>
            <p className="text-xs text-muted-foreground">
              Cadastre sessões na aba <strong>Sessões</strong> para que elas apareçam aqui.
            </p>
            <Link href="/app/sessoes" className={cn(buttonVariants({ variant: "outline" }), "mt-2")}>
              Ir para Sessões
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Past sessions — can do attendance */}
          {sessoesPassadas.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Sessões realizadas — disponíveis para chamada
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sessoesPassadas.map((s) => (
                  <SessaoCard key={s.id} s={s} habilitada />
                ))}
              </div>
            </section>
          )}

          {/* Future sessions — view only */}
          {sessoesFuturas.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Sessões futuras — aguardando data
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sessoesFuturas.map((s) => (
                  <SessaoCard key={s.id} s={s} habilitada={false} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ─── Session card ───────────────────────────────────────────

function SessaoCard({ s, habilitada }: { s: SessaoEnriquecida; habilitada: boolean }) {
  const pct = s.total > 0 ? Math.round((s.presentes / s.total) * 100) : 0;
  const editavel = s.status !== "CONCLUIDA";

  return (
    <Card className={cn("flex flex-col transition-shadow", habilitada ? "hover:shadow-md" : "opacity-60")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="capitalize truncate">{formatDate(s.data)}</span>
            </CardTitle>
            {s.tema && (
              <CardDescription className="line-clamp-2 text-sm">{s.tema}</CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant={tipoBadgeVariant(s.tipo)}>
              {TIPO_SESSAO_LABELS[s.tipo]}
            </Badge>
            {s.tipo !== "MAGNA" && (
              <Badge variant="outline" className="text-[10px]">
                Grau {s.grauSessao}
              </Badge>
            )}
            {s.tipo === "MAGNA" && (
              <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-950/30">
                Todos isentos
              </Badge>
            )}
            {statusBadge(s.status)}
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        {s.total > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Comparecimento
              </span>
              <span className="font-semibold tabular-nums">{s.presentes}/{s.total}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  s.status === "CONCLUIDA" ? "bg-emerald-500" : "bg-primary"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right tabular-nums">{pct}%</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            {habilitada ? "Presença ainda não iniciada" : "Sessão ainda não ocorreu"}
          </p>
        )}

        {habilitada ? (
          <Link
            href={`/presenca/${s.id}`}
            className={cn(
              buttonVariants({ variant: editavel ? "default" : "outline" }),
              "w-full mt-auto text-center gap-2"
            )}
          >
            {s.status === "CONCLUIDA" ? (
              <><Lock className="h-4 w-4" /> Ver Presença</>
            ) : s.status === "ABERTA" ? (
              <><ClipboardCheck className="h-4 w-4" /> Continuar Chamada</>
            ) : (
              <><ClipboardCheck className="h-4 w-4" /> Iniciar Chamada</>
            )}
          </Link>
        ) : (
          <div className="mt-auto rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
            <CalendarClock className="h-4 w-4 mx-auto mb-1" />
            Disponível após {formatDate(s.data)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
