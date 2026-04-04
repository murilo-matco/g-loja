"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CATEGORIA_DESPESA_LABELS,
  CATEGORIA_RECEITA_LABELS,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  getTransacoes,
  criarTransacao,
  atualizarTransacao,
  excluirTransacao,
  toggleStatus,
  type Transacao,
  type TipoTransacao,
  type StatusPagamento,
} from "@/lib/financeiro-store";
import { getIrmaos } from "@/lib/irmaos-store";

// ─── Formatters ─────────────────────────────────────────────

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDateBR = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(new Date(y, m - 1, d));
};

// ─── Helpers ────────────────────────────────────────────────

async function loadNomesIrmaos(): Promise<string[]> {
  if (typeof window === "undefined") return [];
  return (await getIrmaos()).map((i) => i.nome);
}

function categoriaLabel(tipo: TipoTransacao, key: string) {
  return tipo === "RECEITA"
    ? CATEGORIA_RECEITA_LABELS[key] ?? key
    : CATEGORIA_DESPESA_LABELS[key] ?? key;
}

function StatusBadge({ status, onClick }: { status: StatusPagamento; onClick?: () => void }) {
  if (status === "PAGO") {
    return (
      <Badge
        variant="default"
        className={cn(
          "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 gap-1",
          onClick && "cursor-pointer"
        )}
        onClick={onClick}
      >
        <CheckCircle2 className="h-3 w-3" />
        Pago
      </Badge>
    );
  }
  return (
    <Badge
      variant="destructive"
      className={cn("gap-1", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <Clock className="h-3 w-3" />
      Pendente
    </Badge>
  );
}

// ─── Empty form state ───────────────────────────────────────

const EMPTY_FORM = {
  tipo: "RECEITA" as TipoTransacao,
  valor: "",
  descricao: "",
  categoria: Object.keys(CATEGORIA_RECEITA_LABELS)[0],
  irmao: "",
  vencimento: "",
  pago: false,
};

// ─── Component ──────────────────────────────────────────────

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [nomesIrmaos, setNomesIrmaos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<Transacao | null>(null);

  useEffect(() => {
    async function load() {
      setTransacoes(await getTransacoes());
      setNomesIrmaos(await loadNomesIrmaos());
      setLoading(false);
    }
    load();
  }, []);

  // ── Derived data ──────────────────────────────────────────

  const receitas = useMemo(() => transacoes.filter((t) => t.tipo === "RECEITA"), [transacoes]);
  const despesas = useMemo(() => transacoes.filter((t) => t.tipo === "DESPESA"), [transacoes]);

  const totalReceitas = useMemo(() => receitas.reduce((s, t) => s + t.valor, 0), [receitas]);
  const totalDespesas = useMemo(() => despesas.reduce((s, t) => s + t.valor, 0), [despesas]);
  const saldo = totalReceitas - totalDespesas;

  const pendentes = useMemo(() => transacoes.filter((t) => t.status === "PENDENTE").length, [transacoes]);

  const categoriaKeys = useMemo(() => {
    return form.tipo === "RECEITA"
      ? Object.keys(CATEGORIA_RECEITA_LABELS)
      : Object.keys(CATEGORIA_DESPESA_LABELS);
  }, [form.tipo]);

  // ── Form handlers ─────────────────────────────────────────

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((t: Transacao) => {
    setEditingId(t.id);
    setForm({
      tipo: t.tipo,
      valor: String(t.valor),
      descricao: t.descricao,
      categoria: t.categoria,
      irmao: t.irmao ?? "",
      vencimento: t.vencimento,
      pago: t.status === "PAGO",
    });
    setDialogOpen(true);
  }, []);

  const handleTipoChange = useCallback((tipo: TipoTransacao) => {
    const firstCat = tipo === "RECEITA"
      ? Object.keys(CATEGORIA_RECEITA_LABELS)[0]
      : Object.keys(CATEGORIA_DESPESA_LABELS)[0];
    setForm((prev) => ({ ...prev, tipo, categoria: firstCat, irmao: "" }));
  }, []);

  const handleSave = useCallback(async () => {
    const valor = parseFloat(form.valor);
    if (!form.descricao.trim() || isNaN(valor) || valor <= 0 || !form.vencimento) return;

    const data = {
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      categoria: form.categoria,
      valor,
      vencimento: form.vencimento,
      status: (form.pago ? "PAGO" : "PENDENTE") as StatusPagamento,
      irmao: form.tipo === "RECEITA" && form.irmao ? form.irmao : null,
    };

    if (editingId) {
      await atualizarTransacao(editingId, data);
    } else {
      await criarTransacao(data);
    }

    setTransacoes(await getTransacoes());
    setDialogOpen(false);
    resetForm();
  }, [form, editingId, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!deleteDialog) return;
    await excluirTransacao(deleteDialog.id);
    setTransacoes(await getTransacoes());
    setDeleteDialog(null);
  }, [deleteDialog]);

  const handleToggleStatus = useCallback(async (id: string) => {
    await toggleStatus(id);
    setTransacoes(await getTransacoes());
  }, []);

  // ── Loading ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="size-7 text-primary" />
            Financeiro
          </h1>
          <p className="text-muted-foreground">
            Tesouraria — receitas, despesas e fluxo da loja
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 gap-2">
          <Plus className="size-4" />
          Nova Transação
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Receitas</CardTitle>
            <TrendingUp className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-lg md:text-2xl font-bold text-emerald-600 dark:text-emerald-500 tabular-nums">
              {formatBRL(totalReceitas)}
            </p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{receitas.length} lançamento(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Despesas</CardTitle>
            <TrendingDown className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-lg md:text-2xl font-bold text-red-600 dark:text-red-500 tabular-nums">
              {formatBRL(totalDespesas)}
            </p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{despesas.length} lançamento(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
            <DollarSign className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-lg md:text-2xl font-bold tabular-nums",
              saldo >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
            )}>
              {formatBRL(saldo)}
            </p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Receitas − despesas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-lg md:text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {pendentes}
            </p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">lançamento(s) a pagar/receber</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions table */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
          <CardDescription>Clique no status para alternar entre Pago/Pendente</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="receitas" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="receitas" className="gap-1.5">
                <ArrowUpCircle className="size-4 text-emerald-600" />
                Receitas ({receitas.length})
              </TabsTrigger>
              <TabsTrigger value="despesas" className="gap-1.5">
                <ArrowDownCircle className="size-4 text-red-600" />
                Despesas ({despesas.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="receitas" className="mt-0">
              <TransacaoTable
                rows={receitas}
                tipo="RECEITA"
                onEdit={openEdit}
                onDelete={setDeleteDialog}
                onToggleStatus={handleToggleStatus}
              />
            </TabsContent>
            <TabsContent value="despesas" className="mt-0">
              <TransacaoTable
                rows={despesas}
                tipo="DESPESA"
                onEdit={openEdit}
                onDelete={setDeleteDialog}
                onToggleStatus={handleToggleStatus}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Create/Edit Dialog ─────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) { setDialogOpen(false); resetForm(); }
        }}
      >
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar transação" : "Nova transação"}</DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Altere os campos desejados e clique em Salvar."
                  : "Registre uma nova receita ou despesa."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Tipo */}
              <div className="space-y-2">
                <Label>Tipo</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={form.tipo === "RECEITA" ? "default" : "outline"}
                    className="flex-1 gap-1.5"
                    onClick={() => handleTipoChange("RECEITA")}
                  >
                    <ArrowUpCircle className="size-4" />
                    Receita
                  </Button>
                  <Button
                    type="button"
                    variant={form.tipo === "DESPESA" ? "default" : "outline"}
                    className="flex-1 gap-1.5"
                    onClick={() => handleTipoChange("DESPESA")}
                  >
                    <ArrowDownCircle className="size-4" />
                    Despesa
                  </Button>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao">
                  Descrição <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="descricao"
                  placeholder="Ex.: Mensalidade abril"
                  value={form.descricao}
                  onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                  required
                />
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <Label htmlFor="valor">
                  Valor <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">R$</span>
                  <Input
                    id="valor"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0,00"
                    className="pl-10"
                    value={form.valor}
                    onChange={(e) => setForm((p) => ({ ...p, valor: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(v) => { if (v != null) setForm((p) => ({ ...p, categoria: v })); }}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoriaKeys.map((key) => (
                      <SelectItem key={key} value={key}>
                        {form.tipo === "RECEITA" ? CATEGORIA_RECEITA_LABELS[key] : CATEGORIA_DESPESA_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Irmão (receita only) */}
              {form.tipo === "RECEITA" && (
                <div className="space-y-2">
                  <Label>Irmão (opcional)</Label>
                  <Select
                    value={form.irmao || "__none__"}
                    onValueChange={(v) => { if (v != null) setForm((p) => ({ ...p, irmao: v === "__none__" ? "" : v })); }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o irmão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Não associado</SelectItem>
                      {nomesIrmaos.map((nome) => (
                        <SelectItem key={nome} value={nome}>{nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Vencimento */}
              <div className="space-y-2">
                <Label htmlFor="vencimento">
                  Data de vencimento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="vencimento"
                  type="date"
                  value={form.vencimento}
                  onChange={(e) => setForm((p) => ({ ...p, vencimento: e.target.value }))}
                  required
                />
              </div>

              {/* Pago */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pago"
                  checked={form.pago}
                  onChange={(e) => setForm((p) => ({ ...p, pago: e.target.checked }))}
                  className="size-4 rounded border border-input accent-primary"
                />
                <Label htmlFor="pago" className="font-normal cursor-pointer">
                  Já foi pago / recebido
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-1.5">
                {editingId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                {editingId ? "Salvar alterações" : "Criar lançamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────── */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Excluir transação?</DialogTitle>
            <DialogDescription>
              Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {deleteDialog && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
              <p className="font-medium">{deleteDialog.descricao}</p>
              <div className="flex justify-between text-muted-foreground">
                <span>{categoriaLabel(deleteDialog.tipo, deleteDialog.categoria)}</span>
                <span className="font-semibold tabular-nums">{formatBRL(deleteDialog.valor)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} className="gap-1.5">
              <Trash2 className="size-4" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Reusable table ─────────────────────────────────────────

function TransacaoTable({
  rows,
  tipo,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  rows: Transacao[];
  tipo: TipoTransacao;
  onEdit: (t: Transacao) => void;
  onDelete: (t: Transacao) => void;
  onToggleStatus: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground border rounded-lg border-dashed">
        Nenhum lançamento de {tipo === "RECEITA" ? "receita" : "despesa"} encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead className="hidden md:table-cell">Categoria</TableHead>
            {tipo === "RECEITA" && <TableHead className="hidden lg:table-cell">Irmão</TableHead>}
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px] md:w-[100px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="max-w-[220px] font-medium">
                <span>{row.descricao}</span>
                <span className="block text-xs text-muted-foreground sm:hidden">{formatDateBR(row.vencimento)}</span>
              </TableCell>
              <TableCell className="hidden md:table-cell">{categoriaLabel(tipo, row.categoria)}</TableCell>
              {tipo === "RECEITA" && (
                <TableCell className="hidden lg:table-cell text-muted-foreground">{row.irmao ?? "—"}</TableCell>
              )}
              <TableCell className="text-right tabular-nums font-semibold">
                {formatBRL(row.valor)}
              </TableCell>
              <TableCell className="hidden sm:table-cell tabular-nums">{formatDateBR(row.vencimento)}</TableCell>
              <TableCell>
                <StatusBadge status={row.status} onClick={() => onToggleStatus(row.id)} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => onEdit(row)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Excluir" onClick={() => onDelete(row)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
