"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CARGO_LABELS,
  CATEGORIA_DESPESA_LABELS,
  CATEGORIA_RECEITA_LABELS,
  GRAU_LABELS,
  TIPO_SESSAO_LABELS,
  STATUS_SESSAO_LABELS,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  FileBarChart,
  Printer,
  ClipboardCheck,
  DollarSign,
  UserCheck,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  getSessoes,
  getPresencas,
  type SessaoStore,
  type PresencaStore,
} from "@/lib/presenca-store";
import {
  getTransacoes,
  type Transacao,
} from "@/lib/financeiro-store";

// ═══════════════════════════════════════════════════════════════
// Formatters
// ═══════════════════════════════════════════════════════════════

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDateBR = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(new Date(y, m - 1, d));
};

// ═══════════════════════════════════════════════════════════════
// Shared types & helpers
// ═══════════════════════════════════════════════════════════════

const MESES = [
  { valor: 1, nome: "Janeiro" },
  { valor: 2, nome: "Fevereiro" },
  { valor: 3, nome: "Março" },
  { valor: 4, nome: "Abril" },
  { valor: 5, nome: "Maio" },
  { valor: 6, nome: "Junho" },
  { valor: 7, nome: "Julho" },
  { valor: 8, nome: "Agosto" },
  { valor: 9, nome: "Setembro" },
  { valor: 10, nome: "Outubro" },
  { valor: 11, nome: "Novembro" },
  { valor: 12, nome: "Dezembro" },
];

const ANOS = [2024, 2025, 2026, 2027];

function mesAnoFromIso(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return { mes: m, ano: y };
}

// ═══════════════════════════════════════════════════════════════
// Finance helpers
// ═══════════════════════════════════════════════════════════════

type TipoLinha = "RECEITA" | "DESPESA";

function categoriaLabel(tipo: TipoLinha, key: string) {
  return tipo === "RECEITA"
    ? CATEGORIA_RECEITA_LABELS[key] ?? key
    : CATEGORIA_DESPESA_LABELS[key] ?? key;
}

function groupByCategory(linhas: Transacao[], tipo: TipoLinha) {
  const filtered = linhas.filter((l) => l.tipo === tipo);
  const map = new Map<string, Transacao[]>();
  for (const row of filtered) {
    const list = map.get(row.categoria) ?? [];
    list.push(row);
    map.set(row.categoria, list);
  }
  return Array.from(map.entries())
    .map(([cat, itens]) => ({
      categoria: cat,
      itens,
      subtotal: itens.reduce((s, i) => s + i.valor, 0),
    }))
    .sort((a, b) => categoriaLabel(tipo, a.categoria).localeCompare(categoriaLabel(tipo, b.categoria), "pt-BR"));
}

function StatusBadge({ status }: { status: "PAGO" | "PENDENTE" }) {
  if (status === "PAGO") {
    return <Badge variant="default" className="bg-emerald-600 text-white hover:bg-emerald-600/90">Pago</Badge>;
  }
  return <Badge variant="destructive">Pendente</Badge>;
}

// ═══════════════════════════════════════════════════════════════
// Presence report types
// ═══════════════════════════════════════════════════════════════

interface SessaoPresencaResumo {
  sessao: SessaoStore;
  presencas: PresencaStore[];
  presentes: number;
  ausentes: number;
  justificados: number;
  pct: number;
}

interface IrmaoFrequencia {
  irmaoId: string;
  nome: string;
  cim: string;
  grau: string;
  cargo: string;
  sessoesPresente: number;
  totalSessoes: number;
  pct: number;
  justificativas: number;
  faltas: number;
}

// ═══════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════

export default function RelatoriosPage() {
  const [mes, setMes] = useState(4);
  const [ano, setAno] = useState(2026);
  const [activeTab, setActiveTab] = useState<string>("presenca");
  const [loaded, setLoaded] = useState(false);

  // Presence data from store
  const [allSessoes, setAllSessoes] = useState<SessaoStore[]>([]);
  const [allPresencas, setAllPresencas] = useState<Record<string, PresencaStore[]>>({});

  // Finance data from store
  const [allTransacoes, setAllTransacoes] = useState<Transacao[]>([]);

  useEffect(() => {
    async function load() {
      const sessoes = await getSessoes();
      const presMap: Record<string, PresencaStore[]> = {};
      for (const s of sessoes) {
        presMap[s.id] = await getPresencas(s.id);
      }
      setAllSessoes(sessoes);
      setAllPresencas(presMap);
      setAllTransacoes(await getTransacoes());
      setLoaded(true);
    }
    load();
  }, []);

  const periodoLabel = `${MESES.find((m) => m.valor === mes)?.nome ?? ""} de ${ano}`;

  // ── Presence report data ──────────────────────────────────

  const sessoesConcluidas = useMemo(() => {
    return allSessoes
      .filter((s) => {
        if (s.status !== "CONCLUIDA") return false;
        const { mes: m, ano: a } = mesAnoFromIso(s.data);
        return m === mes && a === ano;
      })
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [allSessoes, mes, ano]);

  const resumosSessoes: SessaoPresencaResumo[] = useMemo(() => {
    return sessoesConcluidas.map((s) => {
      const presencas = allPresencas[s.id] ?? [];
      const presentes = presencas.filter((p) => p.presente).length;
      const ausentes = presencas.length - presentes;
      const justificados = presencas.filter((p) => !p.presente && p.justificativa).length;
      const pct = presencas.length > 0 ? Math.round((presentes / presencas.length) * 100) : 0;
      return { sessao: s, presencas, presentes, ausentes, justificados, pct };
    });
  }, [sessoesConcluidas, allPresencas]);

  const frequenciaIrmaos: IrmaoFrequencia[] = useMemo(() => {
    if (sessoesConcluidas.length === 0) return [];

    const irmaoMap = new Map<string, IrmaoFrequencia>();

    for (const s of sessoesConcluidas) {
      const presencas = allPresencas[s.id] ?? [];
      for (const p of presencas) {
        const existing = irmaoMap.get(p.irmaoId);
        if (existing) {
          existing.totalSessoes++;
          if (p.presente) existing.sessoesPresente++;
          if (!p.presente && p.justificativa) existing.justificativas++;
          if (!p.presente && !p.justificativa) existing.faltas++;
        } else {
          irmaoMap.set(p.irmaoId, {
            irmaoId: p.irmaoId,
            nome: p.nome,
            cim: p.cim,
            grau: p.grau,
            cargo: p.cargo,
            sessoesPresente: p.presente ? 1 : 0,
            totalSessoes: 1,
            pct: 0,
            justificativas: !p.presente && p.justificativa ? 1 : 0,
            faltas: !p.presente && !p.justificativa ? 1 : 0,
          });
        }
      }
    }

    const result = Array.from(irmaoMap.values());
    for (const r of result) {
      r.pct = r.totalSessoes > 0 ? Math.round((r.sessoesPresente / r.totalSessoes) * 100) : 0;
    }
    return result.sort((a, b) => b.pct - a.pct || a.nome.localeCompare(b.nome, "pt-BR"));
  }, [sessoesConcluidas, allPresencas]);

  const mediaFrequencia = useMemo(() => {
    if (resumosSessoes.length === 0) return 0;
    return Math.round(resumosSessoes.reduce((s, r) => s + r.pct, 0) / resumosSessoes.length);
  }, [resumosSessoes]);

  const totalPresencasGeral = useMemo(() => {
    return resumosSessoes.reduce((s, r) => s + r.presentes, 0);
  }, [resumosSessoes]);

  const totalAusenciasGeral = useMemo(() => {
    return resumosSessoes.reduce((s, r) => s + r.ausentes, 0);
  }, [resumosSessoes]);

  const irregulares = useMemo(() => {
    return frequenciaIrmaos.filter((i) => i.pct < 50);
  }, [frequenciaIrmaos]);

  // ── Finance report data ───────────────────────────────────

  const lancamentosPeriodo = useMemo(() => {
    return allTransacoes.filter((l) => {
      const { mes: m, ano: a } = mesAnoFromIso(l.vencimento);
      return m === mes && a === ano;
    });
  }, [allTransacoes, mes, ano]);

  const totalReceitas = useMemo(
    () => lancamentosPeriodo.filter((l) => l.tipo === "RECEITA").reduce((s, l) => s + l.valor, 0),
    [lancamentosPeriodo]
  );
  const totalDespesas = useMemo(
    () => lancamentosPeriodo.filter((l) => l.tipo === "DESPESA").reduce((s, l) => s + l.valor, 0),
    [lancamentosPeriodo]
  );
  const saldo = totalReceitas - totalDespesas;
  const gruposReceitas = useMemo(() => groupByCategory(lancamentosPeriodo, "RECEITA"), [lancamentosPeriodo]);
  const gruposDespesas = useMemo(() => groupByCategory(lancamentosPeriodo, "DESPESA"), [lancamentosPeriodo]);

  // ── Loading ───────────────────────────────────────────────

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header + filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="size-7 text-primary" />
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">
            Relatórios mensais de presença e finanças da Loja
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="mes">Mês</Label>
            <Select value={String(mes)} onValueChange={(v) => { if (v != null) setMes(Number(v)); }}>
              <SelectTrigger id="mes" className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MESES.map((m) => (
                  <SelectItem key={m.valor} value={String(m.valor)}>{m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ano">Ano</Label>
            <Select value={String(ano)} onValueChange={(v) => { if (v != null) setAno(Number(v)); }}>
              <SelectTrigger id="ano" className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ANOS.map((a) => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="size-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Print header — visible only when printing */}
      <div className="hidden print:block border-b border-black/20 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500">G-Loja — Gestão Maçônica</p>
            <h2 className="text-xl font-bold mt-1 text-black">
              {activeTab === "presenca" ? "Relatório de Presença" : "Balancete Mensal"}
            </h2>
            <p className="text-sm text-gray-600">Período: {periodoLabel}</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Emitido em {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date())}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="presenca" onValueChange={(v) => setActiveTab(v as string)}>
        <TabsList className="print:hidden">
          <TabsTrigger value="presenca" className="gap-1.5 px-4">
            <ClipboardCheck className="h-4 w-4" />
            Presença
          </TabsTrigger>
          <TabsTrigger value="financas" className="gap-1.5 px-4">
            <DollarSign className="h-4 w-4" />
            Finanças
          </TabsTrigger>
        </TabsList>

        {/* ═══ TAB: PRESENÇA ═══ */}
        <TabsContent value="presenca" className="space-y-6 mt-4">
          {sessoesConcluidas.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center space-y-3">
                <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Nenhuma sessão concluída em <span className="font-medium">{periodoLabel}</span>.
                </p>
                <p className="text-xs text-muted-foreground">
                  Conclua sessões na aba de Presença para gerar o relatório.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-2">
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <CalendarDays className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold tabular-nums">{sessoesConcluidas.length}</p>
                        <p className="text-xs text-muted-foreground">Sessões realizadas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold tabular-nums text-emerald-600">{mediaFrequencia}%</p>
                        <p className="text-xs text-muted-foreground">Frequência média</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold tabular-nums">{totalPresencasGeral}</p>
                        <p className="text-xs text-muted-foreground">Presenças registradas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        irregulares.length > 0 ? "bg-amber-500/10" : "bg-emerald-500/10"
                      )}>
                        {irregulares.length > 0
                          ? <AlertTriangle className="h-5 w-5 text-amber-600" />
                          : <UserCheck className="h-5 w-5 text-emerald-600" />}
                      </div>
                      <div>
                        <p className={cn("text-2xl font-bold tabular-nums", irregulares.length > 0 ? "text-amber-600" : "text-emerald-600")}>
                          {irregulares.length}
                        </p>
                        <p className="text-xs text-muted-foreground">Irregulares (&lt;50%)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Per-session breakdown */}
              <Card className="print:shadow-none print:border print:border-foreground/20">
                <CardHeader>
                  <CardTitle className="text-lg">Presença por Sessão</CardTitle>
                  <CardDescription>Resumo de comparecimento em cada sessão concluída — {periodoLabel}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Tema</TableHead>
                        <TableHead className="text-center">Presentes</TableHead>
                        <TableHead className="text-center">Ausentes</TableHead>
                        <TableHead className="text-center">Justificados</TableHead>
                        <TableHead className="text-right">Frequência</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumosSessoes.map((r) => (
                        <TableRow key={r.sessao.id}>
                          <TableCell className="font-medium tabular-nums whitespace-nowrap">
                            {formatDateBR(r.sessao.data)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {TIPO_SESSAO_LABELS[r.sessao.tipo]}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {r.sessao.tema ?? "—"}
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            <span className="text-emerald-600 font-semibold">{r.presentes}</span>
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            <span className="text-red-500 font-semibold">{r.ausentes}</span>
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            <span className="text-blue-600 font-semibold">{r.justificados}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-2 w-16 rounded-full bg-muted overflow-hidden hidden sm:block print:block">
                                <div
                                  className={cn("h-full rounded-full", r.pct >= 50 ? "bg-emerald-500" : "bg-amber-500")}
                                  style={{ width: `${r.pct}%` }}
                                />
                              </div>
                              <span className={cn("font-semibold tabular-nums text-sm", r.pct >= 50 ? "text-emerald-600" : "text-amber-600")}>
                                {r.pct}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="font-medium">Totais</TableCell>
                        <TableCell className="text-center font-semibold tabular-nums text-emerald-600">{totalPresencasGeral}</TableCell>
                        <TableCell className="text-center font-semibold tabular-nums text-red-500">{totalAusenciasGeral}</TableCell>
                        <TableCell className="text-center font-semibold tabular-nums text-blue-600">
                          {resumosSessoes.reduce((s, r) => s + r.justificados, 0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{mediaFrequencia}%</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              </Card>

              {/* Per-member breakdown */}
              <Card className="print:shadow-none print:border print:border-foreground/20">
                <CardHeader>
                  <CardTitle className="text-lg">Frequência Individual</CardTitle>
                  <CardDescription>
                    Percentual de comparecimento de cada Irmão no período — {periodoLabel}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Irmão</TableHead>
                        <TableHead>CIM</TableHead>
                        <TableHead className="hidden md:table-cell print:table-cell">Grau</TableHead>
                        <TableHead className="hidden lg:table-cell print:table-cell">Cargo</TableHead>
                        <TableHead className="text-center">Pres.</TableHead>
                        <TableHead className="text-center">Aust.</TableHead>
                        <TableHead className="text-center">Just.</TableHead>
                        <TableHead className="text-right">Frequência</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {frequenciaIrmaos.map((i) => (
                        <TableRow key={i.irmaoId} className={cn(i.pct < 50 && "bg-amber-50/50 dark:bg-amber-950/10")}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {i.pct < 50 && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                              <span className="truncate max-w-[180px]">{i.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">{i.cim}</TableCell>
                          <TableCell className="hidden md:table-cell print:table-cell text-muted-foreground">{GRAU_LABELS[i.grau] ?? i.grau}</TableCell>
                          <TableCell className="hidden lg:table-cell print:table-cell text-muted-foreground">{CARGO_LABELS[i.cargo] ?? i.cargo}</TableCell>
                          <TableCell className="text-center tabular-nums">
                            <span className="text-emerald-600 font-semibold">{i.sessoesPresente}</span>
                            <span className="text-muted-foreground">/{i.totalSessoes}</span>
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            <span className="text-red-500 font-semibold">{i.faltas}</span>
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            <span className="text-blue-600 font-semibold">{i.justificativas}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-2 w-16 rounded-full bg-muted overflow-hidden hidden sm:block print:block">
                                <div
                                  className={cn("h-full rounded-full", i.pct >= 75 ? "bg-emerald-500" : i.pct >= 50 ? "bg-blue-500" : "bg-amber-500")}
                                  style={{ width: `${i.pct}%` }}
                                />
                              </div>
                              <span className={cn(
                                "font-semibold tabular-nums text-sm",
                                i.pct >= 75 ? "text-emerald-600" : i.pct >= 50 ? "text-blue-600" : "text-amber-600"
                              )}>
                                {i.pct}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Legend */}
                  <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Regular (&ge;75%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Atenção (50–74%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Irregular (&lt;50%)
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ═══ TAB: FINANÇAS ═══ */}
        <TabsContent value="financas" className="space-y-6 mt-4">
          <Card className="print:shadow-none print:border print:border-foreground/20">
            <CardHeader className="space-y-1 print:pb-2">
              <CardTitle className="text-xl print:text-2xl">Balancete Mensal</CardTitle>
              <CardDescription className="print:text-foreground/80">
                Período: <span className="font-medium">{periodoLabel}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 print:space-y-4">
              {/* Summary cards */}
              <div className="grid gap-3 sm:grid-cols-3 rounded-lg border bg-muted/30 p-4 print:border-foreground/20 print:bg-transparent">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground print:text-foreground/70">Total receitas</p>
                  <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-500 print:text-emerald-800 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4" />
                    {formatBRL(totalReceitas)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground print:text-foreground/70">Total despesas</p>
                  <p className="text-lg font-semibold tabular-nums text-red-600 dark:text-red-500 print:text-red-800 flex items-center gap-1.5">
                    <TrendingDown className="h-4 w-4" />
                    {formatBRL(totalDespesas)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground print:text-foreground/70">Saldo do período</p>
                  <p className={cn(
                    "text-lg font-semibold tabular-nums flex items-center gap-1.5",
                    saldo >= 0 ? "text-blue-600 dark:text-blue-400 print:text-blue-900" : "text-red-600 dark:text-red-400 print:text-red-900"
                  )}>
                    <DollarSign className="h-4 w-4" />
                    {formatBRL(saldo)}
                  </p>
                </div>
              </div>

              <Separator className="print:bg-foreground/20" />

              {lancamentosPeriodo.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg border-dashed">
                  Nenhum lançamento encontrado para o período selecionado.
                </p>
              ) : (
                <>
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground print:text-foreground">
                      Receitas por categoria
                    </h3>
                    {gruposReceitas.map((grupo) => (
                      <div key={grupo.categoria} className="rounded-lg border print:break-inside-avoid">
                        <div className="bg-muted/50 px-3 py-2 text-sm font-medium print:bg-transparent print:border-b">
                          {categoriaLabel("RECEITA", grupo.categoria)}
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Vencimento</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {grupo.itens.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell className="max-w-[280px]">{row.descricao}</TableCell>
                                <TableCell>{formatDateBR(row.vencimento)}</TableCell>
                                <TableCell><StatusBadge status={row.status} /></TableCell>
                                <TableCell className="text-right tabular-nums">{formatBRL(row.valor)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">{formatBRL(grupo.subtotal)}</TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    ))}
                  </section>

                  <Separator className="print:bg-foreground/20" />

                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground print:text-foreground">
                      Despesas por categoria
                    </h3>
                    {gruposDespesas.map((grupo) => (
                      <div key={grupo.categoria} className="rounded-lg border print:break-inside-avoid">
                        <div className="bg-muted/50 px-3 py-2 text-sm font-medium print:bg-transparent print:border-b">
                          {categoriaLabel("DESPESA", grupo.categoria)}
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Vencimento</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {grupo.itens.map((row) => (
                              <TableRow key={row.id}>
                                <TableCell className="max-w-[280px]">{row.descricao}</TableCell>
                                <TableCell>{formatDateBR(row.vencimento)}</TableCell>
                                <TableCell><StatusBadge status={row.status} /></TableCell>
                                <TableCell className="text-right tabular-nums">{formatBRL(row.valor)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">{formatBRL(grupo.subtotal)}</TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    ))}
                  </section>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
