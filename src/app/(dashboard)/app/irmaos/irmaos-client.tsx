"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  RotateCcw,
  KeyRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { CARGO_LABELS, GRAU_LABELS, STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getIrmaos, excluirIrmao } from "@/lib/irmaos-store";
import {
  isAdmin,
  getUsuarios,
  criarUsuario,
  excluirUsuario,
  resetarSenhaUsuario,
  atualizarUsuario,
  type Usuario,
  type CargoSistema,
  CARGO_SISTEMA_LABELS,
  PERMISSOES,
} from "@/lib/auth-store";
import type { Irmao } from "@/types/irmao";

const STATUS_FILTER_VALUES = ["TODOS", "ATIVO", "ADORMECIDO", "PLACET", "IRREGULAR"] as const;
type StatusFilterValue = (typeof STATUS_FILTER_VALUES)[number];

const CARGOS_COM_ACESSO: CargoSistema[] = [
  "CHANCELER", "TESOUREIRO", "SECRETARIO", "ORADOR",
  "PRIMEIRO_VIGILANTE", "SEGUNDO_VIGILANTE", "MEMBRO",
];

const SIDEBAR_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/app/irmaos": "Irmãos",
  "/app/sessoes": "Sessões",
  "/app/presenca": "Presença",
  "/app/acoes": "Ações no site",
  "/app/trabalhos": "Trabalhos",
  "/app/financeiro": "Financeiro",
  "/app/relatorios": "Relatórios",
};

function statusBadgeVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "ATIVO": return "default";
    case "ADORMECIDO": return "secondary";
    case "PLACET": return "outline";
    case "IRREGULAR": return "destructive";
    default: return "secondary";
  }
}

function filterIrmaos(list: Irmao[], q: string, status: StatusFilterValue): Irmao[] {
  const needle = q.trim().toLowerCase();
  return list.filter((row) => {
    const matchesQuery =
      !needle ||
      row.nome.toLowerCase().includes(needle) ||
      row.cim.replace(/\D/g, "").includes(needle.replace(/\D/g, "")) ||
      row.cim.toLowerCase().includes(needle);
    const matchesStatus = status === "TODOS" ? true : row.status === status;
    return matchesQuery && matchesStatus;
  });
}

export function IrmaosClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const qParam = searchParams.get("q") ?? "";
  const statusParam = (searchParams.get("status") ?? "TODOS") as StatusFilterValue;

  const [searchInput, setSearchInput] = useState(qParam);
  const [rows, setRows] = useState<Irmao[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Irmao | null>(null);

  // Acesso ao sistema
  const admin = isAdmin();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showConcederAcesso, setShowConcederAcesso] = useState<Irmao | null>(null);
  const [showRevogarAcesso, setShowRevogarAcesso] = useState<Irmao | null>(null);
  const [showResetSenha, setShowResetSenha] = useState<Irmao | null>(null);
  const [showInfoAcesso, setShowInfoAcesso] = useState<Irmao | null>(null);
  const [senhaAcesso, setSenhaAcesso] = useState("");
  const [senhaReset, setSenhaReset] = useState("");
  const [erroAcesso, setErroAcesso] = useState("");

  async function reload() {
    setRows(await getIrmaos());
    setUsuarios(await getUsuarios());
  }

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => { setSearchInput(qParam); }, [qParam]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      const next = new URLSearchParams(searchParams.toString());
      if (trimmed) { next.set("q", trimmed); } else { next.delete("q"); }
      if (next.toString() === searchParams.toString()) return;
      const href = next.toString() ? `${pathname}?${next.toString()}` : pathname;
      startTransition(() => { router.replace(href); });
    }, 320);
    return () => window.clearTimeout(handle);
  }, [searchInput, pathname, router, searchParams]);

  const filtered = useMemo(
    () => filterIrmaos(rows, qParam, statusParam),
    [rows, qParam, statusParam]
  );

  const setStatusFilter = useCallback(
    (value: StatusFilterValue) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === "TODOS") { next.delete("status"); } else { next.set("status", value); }
      const qs = next.toString();
      startTransition(() => { router.replace(qs ? `${pathname}?${qs}` : pathname); });
    },
    [pathname, router, searchParams]
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await excluirIrmao(deleteTarget.id);
    await reload();
    setDeleteTarget(null);
  };

  // Helpers de acesso
  function getUsuarioByIrmao(irmao: Irmao): Usuario | undefined {
    if (!irmao.cpf) return undefined;
    const clean = irmao.cpf.replace(/\D/g, "");
    return usuarios.find((u) => u.cpf.replace(/\D/g, "") === clean);
  }

  function cargoToSistema(cargo: string): CargoSistema {
    if (cargo === "VENERAVEL") return "VENERAVEL";
    if (CARGOS_COM_ACESSO.includes(cargo as CargoSistema)) return cargo as CargoSistema;
    return "MEMBRO";
  }

  async function handleConcederAcesso() {
    if (!showConcederAcesso?.cpf) return;
    setErroAcesso("");
    if (senhaAcesso.trim().length < 4) {
      setErroAcesso("A senha deve ter ao menos 4 caracteres.");
      return;
    }
    const cargo = cargoToSistema(showConcederAcesso.cargo);
    const result = await criarUsuario({ cpf: showConcederAcesso.cpf, nome: showConcederAcesso.nome, cargo, senha: senhaAcesso.trim() });
    if (!result.ok) { setErroAcesso(result.erro); return; }
    setShowConcederAcesso(null);
    setSenhaAcesso("");
    await reload();
  }

  async function handleRevogarAcesso() {
    if (!showRevogarAcesso) return;
    const user = getUsuarioByIrmao(showRevogarAcesso);
    if (user) await excluirUsuario(user.id);
    setShowRevogarAcesso(null);
    await reload();
  }

  async function handleResetSenha() {
    if (!showResetSenha) return;
    const user = getUsuarioByIrmao(showResetSenha);
    if (user) await resetarSenhaUsuario(user.id, senhaReset.trim() || undefined);
    setShowResetSenha(null);
    setSenhaReset("");
    await reload();
  }

  async function handleToggleAtivo(irmao: Irmao) {
    const user = getUsuarioByIrmao(irmao);
    if (user) {
      await atualizarUsuario(user.id, { ativo: !user.ativo });
      await reload();
    }
  }

  function openConcederAcesso(irmao: Irmao) {
    setSenhaAcesso("");
    setErroAcesso("");
    setShowConcederAcesso(irmao);
  }

  function openResetSenha(irmao: Irmao) {
    setSenhaReset("");
    setShowResetSenha(irmao);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-muted-foreground" />
            Lista de Irmãos
          </CardTitle>
          <Link href="/app/irmaos/novo" className={cn(buttonVariants(), "gap-1.5")}>
            <Plus className="h-4 w-4" />
            Novo Irmão
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CIM..."
                className="pl-9"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-busy={isPending}
              />
            </div>
            <Select
              value={STATUS_FILTER_VALUES.includes(statusParam) ? statusParam : "TODOS"}
              onValueChange={(v) => { if (v != null) setStatusFilter(v as StatusFilterValue); }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="ATIVO">{STATUS_LABELS.ATIVO}</SelectItem>
                <SelectItem value="ADORMECIDO">{STATUS_LABELS.ADORMECIDO}</SelectItem>
                <SelectItem value="PLACET">{STATUS_LABELS.PLACET}</SelectItem>
                <SelectItem value="IRREGULAR">{STATUS_LABELS.IRREGULAR}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">CIM</TableHead>
                  <TableHead className="hidden lg:table-cell">Grau</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  {admin && <TableHead className="hidden sm:table-cell">Acesso</TableHead>}
                  <TableHead className="w-[80px] md:w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={99} className="h-24 text-center text-muted-foreground">
                      Nenhum irmão encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => {
                    const user = admin ? getUsuarioByIrmao(row) : undefined;
                    const temAcesso = !!user;
                    const podeConceder = admin && !!row.cpf && !temAcesso;
                    const isVeneravel = row.cargo === "VENERAVEL";

                    return (
                      <TableRow key={row.id} className={cn(user && !user.ativo && "opacity-60")}>
                        <TableCell className="font-medium">
                          <span>{row.nome}</span>
                          <span className="block text-xs text-muted-foreground md:hidden">{row.cim}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{row.cim}</TableCell>
                        <TableCell className="hidden lg:table-cell">{GRAU_LABELS[row.grau] ?? row.grau}</TableCell>
                        <TableCell>{CARGO_LABELS[row.cargo] ?? row.cargo}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(row.status)}>
                            {STATUS_LABELS[row.status] ?? row.status}
                          </Badge>
                        </TableCell>

                        {admin && (
                          <TableCell className="hidden sm:table-cell">
                            {isVeneravel ? (
                              <Badge variant="outline" className="gap-1 text-primary border-primary/30">
                                <ShieldCheck className="h-3 w-3" />
                                Admin
                              </Badge>
                            ) : temAcesso ? (
                              <button type="button" onClick={() => setShowInfoAcesso(row)}>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "gap-1 cursor-pointer transition-colors",
                                    user!.ativo
                                      ? "text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                      : "text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                                  )}
                                >
                                  {user!.ativo ? (
                                    <><ShieldCheck className="h-3 w-3" /> Ativo</>
                                  ) : (
                                    <><ShieldOff className="h-3 w-3" /> Desativado</>
                                  )}
                                </Badge>
                              </button>
                            ) : !row.cpf ? (
                              <span className="text-xs text-muted-foreground">Sem CPF</span>
                            ) : (
                              <button
                                type="button"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                onClick={() => openConcederAcesso(row)}
                              >
                                <KeyRound className="h-3 w-3" />
                                Conceder
                              </button>
                            )}
                          </TableCell>
                        )}

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Abrir menu</span>
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/app/irmaos/${row.id}/editar`)}>
                                <Pencil className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(row)}>
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>

                              {admin && !isVeneravel && (
                                <>
                                  <DropdownMenuSeparator />
                                  {temAcesso ? (
                                    <>
                                      <DropdownMenuItem onClick={() => handleToggleAtivo(row)}>
                                        {user!.ativo ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                        {user!.ativo ? "Desativar acesso" : "Ativar acesso"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openResetSenha(row)}>
                                        <RotateCcw className="h-4 w-4" />
                                        Resetar senha
                                      </DropdownMenuItem>
                                      <DropdownMenuItem variant="destructive" onClick={() => setShowRevogarAcesso(row)}>
                                        <ShieldOff className="h-4 w-4" />
                                        Revogar acesso
                                      </DropdownMenuItem>
                                    </>
                                  ) : podeConceder ? (
                                    <DropdownMenuItem onClick={() => openConcederAcesso(row)}>
                                      <KeyRound className="h-4 w-4" />
                                      Conceder acesso
                                    </DropdownMenuItem>
                                  ) : null}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Dialog: Excluir Irmão ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir irmão</DialogTitle>
            <DialogDescription>
              Deseja remover{" "}
              <span className="font-medium text-foreground">{deleteTarget?.nome}</span>{" "}
              da lista?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Conceder Acesso ── */}
      <Dialog open={!!showConcederAcesso} onOpenChange={(open) => !open && setShowConcederAcesso(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Conceder Acesso ao Sistema
            </DialogTitle>
          </DialogHeader>
          {showConcederAcesso && (
            <div className="space-y-4 py-2">
              <div className="rounded-md bg-muted/50 px-4 py-3 space-y-1">
                <p className="text-sm font-medium">{showConcederAcesso.nome}</p>
                <p className="text-xs text-muted-foreground">
                  CPF: {showConcederAcesso.cpf} — Cargo: {CARGO_LABELS[showConcederAcesso.cargo] ?? showConcederAcesso.cargo}
                </p>
              </div>

              <div className="rounded-md bg-muted/50 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Abas com acesso ({CARGO_SISTEMA_LABELS[cargoToSistema(showConcederAcesso.cargo)]}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {PERMISSOES[cargoToSistema(showConcederAcesso.cargo)].map((p) => (
                    <Badge key={p} variant="secondary" className="text-[10px]">
                      {SIDEBAR_LABELS[p] ?? p}
                    </Badge>
                  ))}
                </div>
                {cargoToSistema(showConcederAcesso.cargo) === "MEMBRO" && (
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Irmão comum: vê só a biblioteca de trabalhos conforme o grau (Aprendiz / Companheiro / Mestre).
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha-acesso">Senha para primeiro acesso</Label>
                <Input
                  id="senha-acesso"
                  type="text"
                  placeholder="Defina uma senha simples (mín. 4 caracteres)"
                  value={senhaAcesso}
                  onChange={(e) => { setSenhaAcesso(e.target.value); setErroAcesso(""); }}
                />
                <p className="text-[11px] text-muted-foreground">
                  Informe esta senha ao Irmão. Ele fará login com o <strong>CPF</strong> + esta senha, e será obrigado a trocar no primeiro acesso.
                </p>
              </div>

              {erroAcesso && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
                  {erroAcesso}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConcederAcesso(null)}>Cancelar</Button>
            <Button onClick={handleConcederAcesso} className="gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Conceder Acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Revogar Acesso ── */}
      <Dialog open={!!showRevogarAcesso} onOpenChange={(open) => !open && setShowRevogarAcesso(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldOff className="h-5 w-5" />
              Revogar Acesso
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            <strong>{showRevogarAcesso?.nome}</strong> perderá completamente o acesso ao sistema. Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevogarAcesso(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRevogarAcesso}>Revogar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Resetar Senha ── */}
      <Dialog open={!!showResetSenha} onOpenChange={(open) => !open && setShowResetSenha(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-500" />
              Resetar Senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Defina uma nova senha temporária para <strong>{showResetSenha?.nome}</strong>.
              Será necessário alterá-la no próximo login.
            </p>
            <Input
              type="text"
              placeholder="Nova senha temporária (mín. 4 caracteres)"
              value={senhaReset}
              onChange={(e) => setSenhaReset(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetSenha(null)}>Cancelar</Button>
            <Button onClick={handleResetSenha}>Resetar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Info Acesso ── */}
      <Dialog open={!!showInfoAcesso} onOpenChange={(open) => !open && setShowInfoAcesso(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Acesso de {showInfoAcesso?.nome}
            </DialogTitle>
          </DialogHeader>
          {showInfoAcesso && (() => {
            const user = getUsuarioByIrmao(showInfoAcesso);
            if (!user) return null;
            return (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={user.ativo ? "default" : "secondary"}>
                    {user.ativo ? "Ativo" : "Desativado"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cargo</span>
                  <span className="text-sm font-medium">{CARGO_SISTEMA_LABELS[user.cargo]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Senha</span>
                  <Badge variant="outline" className={user.primeiroAcesso ? "text-amber-600 border-amber-300" : "text-emerald-600 border-emerald-300"}>
                    {user.primeiroAcesso ? "Pendente" : "Alterada"}
                  </Badge>
                </div>
                <hr className="border-border" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Abas com acesso:</p>
                  <div className="flex flex-wrap gap-1">
                    {PERMISSOES[user.cargo].map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px]">
                        {SIDEBAR_LABELS[p] ?? p}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInfoAcesso(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
