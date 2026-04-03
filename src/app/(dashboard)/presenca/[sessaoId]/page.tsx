"use client";

import { useState, useMemo, useCallback, useTransition, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GRAU_LABELS, TIPO_SESSAO_LABELS, STATUS_SESSAO_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCheck,
  ClipboardCheck,
  Lock,
  MessageSquarePlus,
  Save,
  Search,
  UserCheck,
  UserX,
  XCircle,
  CircleDot,
  FileEdit,
  FileText,
  RotateCcw,
  X,
  Loader2,
} from "lucide-react";
import {
  getSessao,
  getPresencas,
  inicializarPresencas,
  salvarPresencas,
  concluirSessao as storeConcluirSessao,
  reabrirSessao as storeReabrirSessao,
  type SessaoStore,
  type PresencaStore,
  type StatusSessao,
} from "@/lib/presenca-store";

// ─── Constants ──────────────────────────────────────────────

const MOTIVOS_RAPIDOS = [
  "Viagem",
  "Saúde",
  "Trabalho",
  "Compromisso familiar",
  "Mudança de domicílio",
  "Licença autorizada",
];

// ─── Helpers ────────────────────────────────────────────────

function formatDateFull(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function statusIcon(status: StatusSessao) {
  switch (status) {
    case "RASCUNHO": return <FileEdit className="h-3.5 w-3.5" />;
    case "ABERTA": return <CircleDot className="h-3.5 w-3.5" />;
    case "CONCLUIDA": return <Lock className="h-3.5 w-3.5" />;
  }
}

function statusBadgeClass(status: StatusSessao) {
  switch (status) {
    case "RASCUNHO": return "";
    case "ABERTA": return "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400";
    case "CONCLUIDA": return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400";
  }
}

// ─── Component ──────────────────────────────────────────────

export default function ChamadaPage() {
  const params = useParams<{ sessaoId: string }>();
  const router = useRouter();
  const sessaoId = params.sessaoId;

  const [sessaoInfo, setSessaoInfo] = useState<SessaoStore | null>(null);
  const [presencas, setPresencas] = useState<PresencaStore[]>([]);
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<"concluir" | "reabrir" | null>(null);
  const [sessaoStatus, setSessaoStatus] = useState<StatusSessao>("RASCUNHO");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  const [justificativaAberta, setJustificativaAberta] = useState<string | null>(null);
  const [justificativaInput, setJustificativaInput] = useState("");

  // Load data from store on mount
  useEffect(() => {
    const sessao = getSessao(sessaoId);
    if (!sessao) {
      setLoading(false);
      return;
    }

    setSessaoInfo(sessao);
    setSessaoStatus(sessao.status);

    let lista = getPresencas(sessaoId);
    if (lista.length === 0 && sessao.status !== "CONCLUIDA") {
      lista = inicializarPresencas(sessaoId);
      setSessaoStatus("ABERTA");
    }

    setPresencas(lista);
    setLoading(false);
  }, [sessaoId]);

  const editavel = sessaoStatus !== "CONCLUIDA";

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return presencas;
    return presencas.filter(
      (p) => p.nome.toLowerCase().includes(needle) || p.cim.includes(needle)
    );
  }, [presencas, search]);

  const totalPresentes = presencas.filter((p) => p.presente).length;
  const totalAusentes = presencas.length - totalPresentes;
  const totalComJustificativa = presencas.filter((p) => !p.presente && p.justificativa).length;
  const pct = presencas.length > 0 ? Math.round((totalPresentes / presencas.length) * 100) : 0;

  // Persist every change to the store
  const persistAndSet = useCallback(
    (updater: (prev: PresencaStore[]) => PresencaStore[]) => {
      setPresencas((prev) => {
        const next = updater(prev);
        salvarPresencas(sessaoId, next);
        return next;
      });
    },
    [sessaoId]
  );

  const togglePresente = useCallback(
    (id: string, checked: boolean) => {
      if (!editavel) return;
      persistAndSet((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, presente: checked, justificativa: checked ? null : p.justificativa }
            : p
        )
      );
      if (checked && justificativaAberta === id) {
        setJustificativaAberta(null);
        setJustificativaInput("");
      }
    },
    [editavel, justificativaAberta, persistAndSet]
  );

  const abrirJustificativa = useCallback(
    (id: string) => {
      const item = presencas.find((p) => p.id === id);
      setJustificativaAberta(id);
      setJustificativaInput(item?.justificativa ?? "");
    },
    [presencas]
  );

  const selecionarMotivoRapido = useCallback(
    (id: string, motivo: string) => {
      persistAndSet((prev) =>
        prev.map((p) => (p.id === id ? { ...p, justificativa: motivo } : p))
      );
      setJustificativaAberta(null);
      setJustificativaInput("");
    },
    [persistAndSet]
  );

  const salvarJustificativaCustom = useCallback(
    (id: string) => {
      const texto = justificativaInput.trim();
      persistAndSet((prev) =>
        prev.map((p) => (p.id === id ? { ...p, justificativa: texto || null } : p))
      );
      setJustificativaAberta(null);
      setJustificativaInput("");
    },
    [justificativaInput, persistAndSet]
  );

  const removerJustificativa = useCallback(
    (id: string) => {
      persistAndSet((prev) =>
        prev.map((p) => (p.id === id ? { ...p, justificativa: null } : p))
      );
    },
    [persistAndSet]
  );

  const marcarTodos = useCallback(() => {
    if (!editavel) return;
    persistAndSet((prev) => prev.map((p) => ({ ...p, presente: true, justificativa: null })));
    setJustificativaAberta(null);
  }, [editavel, persistAndSet]);

  const desmarcarTodos = useCallback(() => {
    if (!editavel) return;
    persistAndSet((prev) => prev.map((p) => ({ ...p, presente: false })));
  }, [editavel, persistAndSet]);

  const handleConcluir = () => {
    startTransition(() => {
      storeConcluirSessao(sessaoId, presencas);
      setSessaoStatus("CONCLUIDA");
      setConfirmDialog(null);
      setJustificativaAberta(null);
    });
  };

  const handleReabrir = () => {
    startTransition(() => {
      storeReabrirSessao(sessaoId);
      setSessaoStatus("ABERTA");
      setConfirmDialog(null);
    });
  };

  // ─── Loading ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Not found ──────────────────────────────────────────

  if (!sessaoInfo) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-sm w-full">
          <CardContent className="py-12 text-center space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Sessão não encontrada.</p>
            <Link href="/presenca">
              <Button variant="outline">Voltar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
      {/* Back + Header */}
      <div>
        <Link
          href="/presenca"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Presença
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 sm:h-7 sm:w-7 text-primary shrink-0" />
              Lista de Chamada
            </h1>
            <p className="text-sm text-muted-foreground capitalize">
              {formatDateFull(sessaoInfo.data)}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary">
                {TIPO_SESSAO_LABELS[sessaoInfo.tipo]}
              </Badge>
              <Badge variant="outline" className={cn("gap-1", statusBadgeClass(sessaoStatus))}>
                {statusIcon(sessaoStatus)}
                {STATUS_SESSAO_LABELS[sessaoStatus]}
              </Badge>
            </div>
            {sessaoInfo.tema && (
              <p className="text-sm text-foreground/80 mt-2 italic">{sessaoInfo.tema}</p>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            {editavel ? (
              <Button onClick={() => setConfirmDialog("concluir")} className="gap-2" disabled={isPending}>
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Salvar e </span>Concluir
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setConfirmDialog("reabrir")} className="gap-2" disabled={isPending}>
                <RotateCcw className="h-4 w-4" />
                Reabrir
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <Card className="text-center">
          <CardContent className="py-3 px-1.5">
            <p className="text-xl sm:text-3xl font-bold tabular-nums">{presencas.length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Convocados</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-3 px-1.5">
            <p className="text-xl sm:text-3xl font-bold tabular-nums text-emerald-600">{totalPresentes}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Presentes</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-3 px-1.5">
            <p className="text-xl sm:text-3xl font-bold tabular-nums text-red-500">{totalAusentes}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Ausentes</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="py-3 px-1.5">
            <p className="text-xl sm:text-3xl font-bold tabular-nums text-blue-600">{totalComJustificativa}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Justificados</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Comparecimento</span>
          <span className="font-semibold tabular-nums">{pct}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              sessaoStatus === "CONCLUIDA" ? "bg-emerald-500" : "bg-primary"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CIM..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {editavel && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={marcarTodos} className="gap-1.5">
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Marcar</span> Todos
            </Button>
            <Button variant="outline" size="sm" onClick={desmarcarTodos} className="gap-1.5">
              <XCircle className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        )}
      </div>

      {/* Attendance List */}
      <Card>
        <CardHeader className="pb-0 sm:pb-0">
          <CardTitle className="text-base">
            {editavel ? "Marque a presença de cada Irmão" : "Presença registrada"}
          </CardTitle>
          <CardDescription>
            {editavel
              ? "Use o switch para marcar presente. Para ausentes, clique em \"Justificar\" para registrar o motivo."
              : "Esta sessão foi concluída. A presença não pode ser alterada."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 px-0 sm:px-6">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Nenhum irmão encontrado.
              </div>
            ) : (
              filtered.map((p) => (
                <div key={p.id} className="group/row">
                  {/* Main row */}
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 sm:px-3 py-3 sm:py-2.5 transition-colors",
                      editavel && "cursor-pointer hover:bg-muted/50 active:bg-muted",
                      p.presente && "bg-emerald-50/50 dark:bg-emerald-950/10"
                    )}
                    onClick={() => editavel && togglePresente(p.id, !p.presente)}
                    role={editavel ? "button" : undefined}
                    tabIndex={editavel ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (editavel && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        togglePresente(p.id, !p.presente);
                      }
                    }}
                  >
                    <div className="shrink-0">
                      {editavel ? (
                        <Switch
                          checked={p.presente}
                          onCheckedChange={(checked) => togglePresente(p.id, checked)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Marcar ${p.nome} como ${p.presente ? "ausente" : "presente"}`}
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full",
                            p.presente
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                              : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                          )}
                        >
                          {p.presente ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium truncate", p.presente ? "text-foreground" : "text-muted-foreground")}>
                        {p.nome}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="text-xs text-muted-foreground tabular-nums">CIM {p.cim}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{GRAU_LABELS[p.grau] ?? p.grau}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {p.presente ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-800 text-xs">
                          Presente
                        </Badge>
                      ) : (
                        <>
                          {p.justificativa ? (
                            <Badge
                              variant="outline"
                              className="gap-1 text-xs text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-50 dark:text-blue-300 dark:border-blue-800 dark:bg-blue-950/30 max-w-[140px] sm:max-w-[200px]"
                            >
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="truncate">{p.justificativa}</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-xs">
                              Ausente
                            </Badge>
                          )}
                          {editavel && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-blue-600"
                              onClick={(e) => { e.stopPropagation(); abrirJustificativa(p.id); }}
                              aria-label="Justificar ausência"
                            >
                              <MessageSquarePlus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Justificativa panel */}
                  {!p.presente && justificativaAberta === p.id && editavel && (
                    <div className="px-4 sm:px-3 pb-3 pt-1 bg-muted/30 border-t border-dashed animate-in slide-in-from-top-1 duration-200">
                      <div className="max-w-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">
                            Justificativa de ausência — {p.nome.split(" ")[0]}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => { setJustificativaAberta(null); setJustificativaInput(""); }}
                            aria-label="Fechar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {MOTIVOS_RAPIDOS.map((motivo) => (
                            <button
                              key={motivo}
                              type="button"
                              onClick={() => selecionarMotivoRapido(p.id, motivo)}
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors border",
                                p.justificativa === motivo
                                  ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700"
                                  : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                              )}
                            >
                              {motivo}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            placeholder="Ou digite um motivo personalizado..."
                            className="h-8 text-sm flex-1"
                            value={justificativaInput}
                            onChange={(e) => setJustificativaInput(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === "Enter") { e.preventDefault(); salvarJustificativaCustom(p.id); }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            className="h-8 gap-1 px-3"
                            onClick={(e) => { e.stopPropagation(); salvarJustificativaCustom(p.id); }}
                          >
                            Salvar
                          </Button>
                        </div>

                        {p.justificativa && (
                          <button
                            type="button"
                            className="text-xs text-destructive hover:underline"
                            onClick={(e) => { e.stopPropagation(); removerJustificativa(p.id); setJustificativaAberta(null); setJustificativaInput(""); }}
                          >
                            Remover justificativa
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Read-only justificativa */}
                  {!editavel && !p.presente && p.justificativa && (
                    <div className="px-4 sm:px-3 pb-2.5 pt-0.5 flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400">
                      <FileText className="h-3 w-3 shrink-0" />
                      <span>Justificativa: {p.justificativa}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom action bar (sticky on mobile) */}
      {editavel && (
        <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-background/95 backdrop-blur-sm border-t sm:relative sm:mx-0 sm:px-0 sm:py-0 sm:border-0 sm:bg-transparent sm:backdrop-blur-none">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{totalPresentes}</span>
              {" "}de{" "}
              <span className="font-semibold text-foreground tabular-nums">{presencas.length}</span>
              {" "}presentes
              {totalComJustificativa > 0 && (
                <span className="text-blue-600 dark:text-blue-400">
                  {" · "}{totalComJustificativa} justificado{totalComJustificativa !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <Button onClick={() => setConfirmDialog("concluir")} className="gap-2" disabled={isPending}>
              <Save className="h-4 w-4" />
              Concluir
            </Button>
          </div>
        </div>
      )}

      {/* Confirm Dialog — Concluir */}
      <Dialog open={confirmDialog === "concluir"} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Concluir sessão?</DialogTitle>
            <DialogDescription>
              Ao concluir, a presença será salva e a sessão ficará bloqueada para edição.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Presentes</span>
              <span className="font-semibold text-emerald-600">{totalPresentes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ausentes</span>
              <span className="font-semibold text-red-500">{totalAusentes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Com justificativa</span>
              <span className="font-semibold text-blue-600">{totalComJustificativa}</span>
            </div>
            {totalAusentes - totalComJustificativa > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sem justificativa</span>
                <span className="font-semibold text-amber-600">{totalAusentes - totalComJustificativa}</span>
              </div>
            )}
          </div>
          {totalAusentes - totalComJustificativa > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Existem {totalAusentes - totalComJustificativa} irmão(s) ausente(s) sem justificativa.
              Deseja continuar mesmo assim?
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancelar</Button>
            <Button onClick={handleConcluir} disabled={isPending} className="gap-2">
              <Lock className="h-4 w-4" />
              Confirmar e Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog — Reabrir */}
      <Dialog open={confirmDialog === "reabrir"} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Reabrir sessão?</DialogTitle>
            <DialogDescription>
              Isso permitirá editar a presença e as justificativas novamente. O status voltará para &ldquo;Aberta&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancelar</Button>
            <Button onClick={handleReabrir} disabled={isPending} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reabrir Sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
