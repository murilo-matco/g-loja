"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { TIPO_SESSAO_LABELS, STATUS_SESSAO_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Clock,
  Loader2,
  Lock,
  CircleDot,
  FileEdit,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import {
  getSessoes,
  criarSessao,
  atualizarSessao,
  excluirSessao,
  type SessaoStore,
  type TipoSessao,
  type StatusSessao,
} from "@/lib/presenca-store";

const TIPOS: TipoSessao[] = ["ORDINARIA", "EXTRAORDINARIA", "MAGNA", "BRANCA", "FUNEBRE"];

function formatSessaoDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function tipoBadgeVariant(tipo: TipoSessao): "default" | "secondary" | "outline" {
  switch (tipo) {
    case "MAGNA": return "default";
    case "ORDINARIA":
    case "BRANCA": return "secondary";
    default: return "outline";
  }
}

function statusBadge(status: StatusSessao) {
  switch (status) {
    case "RASCUNHO":
      return <Badge variant="secondary" className="gap-1 text-xs"><FileEdit className="h-3 w-3" />{STATUS_SESSAO_LABELS.RASCUNHO}</Badge>;
    case "ABERTA":
      return <Badge className="gap-1 text-xs bg-amber-500/15 text-amber-700 border-amber-500/30 hover:bg-amber-500/20 dark:text-amber-400"><CircleDot className="h-3 w-3" />{STATUS_SESSAO_LABELS.ABERTA}</Badge>;
    case "CONCLUIDA":
      return <Badge className="gap-1 text-xs bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20 dark:text-emerald-400"><Lock className="h-3 w-3" />{STATUS_SESSAO_LABELS.CONCLUIDA}</Badge>;
  }
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Empty form ─────────────────────────────────────────────

const EMPTY_FORM = {
  data: "",
  tipo: "ORDINARIA" as TipoSessao,
  tema: "",
  descricao: "",
  pauta: "",
};

// ─── Component ──────────────────────────────────────────────

export default function SessoesPage() {
  const [sessoes, setSessoes] = useState<SessaoStore[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState<SessaoStore | null>(null);

  function reload() {
    setSessoes(getSessoes());
    setLoading(false);
  }

  useEffect(() => { reload(); }, []);

  const sorted = useMemo(
    () => [...sessoes].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [sessoes]
  );

  const hoje = todayISO();

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(s: SessaoStore) {
    setEditingId(s.id);
    setForm({
      data: s.data,
      tipo: s.tipo,
      tema: s.tema ?? "",
      descricao: s.descricao ?? "",
      pauta: s.pauta ?? "",
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.data.trim()) return;

    const data = {
      data: form.data,
      tipo: form.tipo,
      tema: form.tema.trim() || null,
      descricao: form.descricao.trim() || null,
      pauta: form.pauta.trim() || null,
    };

    if (editingId) {
      atualizarSessao(editingId, data);
    } else {
      criarSessao(data);
    }

    setDialogOpen(false);
    resetForm();
    reload();
  }

  function handleDelete() {
    if (!deleteTarget) return;
    excluirSessao(deleteTarget.id);
    setDeleteTarget(null);
    reload();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-primary" />
            Sessões
          </h1>
          <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" />
              Calendário e registro das sessões da Loja
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              Convocação dos obreiros
            </span>
          </p>
        </div>

        <Button type="button" className="gap-2 shrink-0" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova Sessão
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhuma sessão cadastrada ainda.</p>
            <p className="text-xs text-muted-foreground">Clique em &ldquo;Nova Sessão&rdquo; para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((s) => {
            const passada = s.data <= hoje;
            const podeEditar = s.status === "RASCUNHO";

            return (
              <Card key={s.id} className="overflow-hidden border-border/80 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base font-semibold leading-tight capitalize">
                        {formatSessaoDate(s.data)}
                      </CardTitle>
                      {s.tema && (
                        <CardDescription className="mt-1 line-clamp-1">{s.tema}</CardDescription>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant={tipoBadgeVariant(s.tipo)}>
                        {TIPO_SESSAO_LABELS[s.tipo]}
                      </Badge>
                      {statusBadge(s.status)}
                      {passada && s.status === "RASCUNHO" && (
                        <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/30">
                          Pronta p/ chamada
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4 space-y-3 flex-1">
                  {s.descricao && (
                    <p className="text-sm text-foreground/90 leading-relaxed">{s.descricao}</p>
                  )}
                  {s.pauta && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Pauta</p>
                        <p className="text-sm text-muted-foreground leading-snug line-clamp-4">{s.pauta}</p>
                      </div>
                    </>
                  )}
                  {!s.descricao && !s.pauta && (
                    <p className="text-sm text-muted-foreground italic">Sem detalhes adicionais.</p>
                  )}
                </CardContent>

                {podeEditar && (
                  <>
                    <Separator />
                    <div className="flex gap-2 p-3">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(s)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar sessão" : "Nova sessão"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Altere os dados e clique em Salvar." : "Preencha os dados da sessão. Campos com * são obrigatórios."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="sessao-data">Data <span className="text-destructive">*</span></Label>
                <Input id="sessao-data" type="date" required value={form.data} onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: (v ?? "ORDINARIA") as TipoSessao }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>{TIPO_SESSAO_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sessao-tema">Tema / Ordem do dia</Label>
                <Input id="sessao-tema" placeholder="Ex.: Eleição para cargos" value={form.tema} onChange={(e) => setForm((p) => ({ ...p, tema: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sessao-desc">Descrição</Label>
                <Input id="sessao-desc" placeholder="Resumo da sessão (opcional)" value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sessao-pauta">Pauta</Label>
                <Textarea id="sessao-pauta" placeholder="Itens da pauta (opcional)" rows={3} value={form.pauta} onChange={(e) => setForm((p) => ({ ...p, pauta: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button type="submit" className="gap-1.5">
                {editingId ? <><Pencil className="h-4 w-4" /> Salvar</> : <><Plus className="h-4 w-4" /> Criar sessão</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Excluir sessão?</DialogTitle>
            <DialogDescription>
              Essa ação não pode ser desfeita. Dados de presença associados também serão removidos.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
              <p className="font-medium capitalize">{formatSessaoDate(deleteTarget.data)}</p>
              <p className="text-muted-foreground">{TIPO_SESSAO_LABELS[deleteTarget.tipo]} — {deleteTarget.tema ?? "Sem tema"}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} className="gap-1.5">
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
