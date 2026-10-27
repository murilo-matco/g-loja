"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Globe,
  ImagePlus,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIA_TRABALHO_LABELS,
  adicionarMidiasTrabalho,
  criarAcaoPublica,
  excluirTrabalho,
  getAcoesSite,
  type CategoriaTrabalho,
  type Trabalho,
} from "@/lib/trabalhos-store";
import { ENTIDADES, type EntidadeId } from "@/lib/entidades";
import { cn } from "@/lib/utils";

const CATS_PUBLICAS: CategoriaTrabalho[] = ["ACAO", "EVENTO", "FOTO", "OUTRO"];

export default function AcoesPage() {
  const [lista, setLista] = useState<Trabalho[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Trabalho | null>(null);
  const [uploadTarget, setUploadTarget] = useState<Trabalho | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<CategoriaTrabalho>("ACAO");
  const [entidade, setEntidade] = useState<EntidadeId>("loja");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const reload = useCallback(async () => {
    setLista(await getAcoesSite());
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function resetForm() {
    setTitulo("");
    setDescricao("");
    setCategoria("ACAO");
    setEntidade("loja");
    setFiles([]);
    setPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
    setError(null);
  }

  function onPickFiles(selected: FileList | null) {
    if (!selected) return;
    const arr = Array.from(selected).slice(0, 12);
    setFiles(arr);
    setPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return arr.map((f) => URL.createObjectURL(f));
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await criarAcaoPublica({ titulo, descricao, categoria, entidade, files });
      setDialogOpen(false);
      resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao publicar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await excluirTrabalho(deleteTarget.id);
    setDeleteTarget(null);
    await reload();
  }

  async function handleAddMidias(selected: FileList | null) {
    if (!uploadTarget || !selected?.length) return;
    setUploading(true);
    try {
      await adicionarMidiasTrabalho(uploadTarget.id, Array.from(selected).slice(0, 12));
      setUploadTarget(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              Ações no site
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              Publique para a <strong>Loja</strong>, a <strong>Associação</strong> ou a{" "}
              <strong>FRAFEM</strong>. Cada uma tem sua página no portal — sem login para o público.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="secondary" className="gap-1">
                <Globe className="h-3 w-3" /> Visível no site
              </Badge>
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Abrir site público <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <Button
            size="lg"
            className="gap-2 shrink-0"
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Publicar ação
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {lista.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <ImagePlus className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Nenhuma ação no site ainda</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Publique a primeira: título, um texto curto e fotos. Em segundos ela sobe na home.
              </p>
            </div>
            <Button className="gap-2" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" />
              Publicar primeira ação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {lista.map((t) => (
            <Card key={t.id} className="overflow-hidden flex flex-col">
              <div className="aspect-[16/9] bg-muted relative">
                {t.capaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.capaUrl} alt={t.titulo} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <Sparkles className="h-10 w-10 opacity-30" />
                  </div>
                )}
                <Badge className="absolute top-2 left-2 gap-1 bg-emerald-600/90 text-[10px]">
                  <Globe className="h-3 w-3" /> No site
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{t.titulo}</CardTitle>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className="text-[10px]">
                      {ENTIDADES.find((x) => x.id === t.entidade)?.nomeCurto ?? "Loja"}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {CATEGORIA_TRABALHO_LABELS[t.categoria]}
                    </Badge>
                  </div>
                </div>
                {t.descricao && (
                  <CardDescription className="line-clamp-2">{t.descricao}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0 mt-auto flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setUploadTarget(t)}>
                  <Upload className="h-3.5 w-3.5" /> Fotos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(t)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Trabalhos internos (por grau) ficam em{" "}
        <Link href="/app/trabalhos" className="text-primary hover:underline">
          Trabalhos
        </Link>
        — não aparecem no site público.
      </p>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" showCloseButton>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Publicar no site</DialogTitle>
              <DialogDescription>
                Vai direto para a seção &ldquo;Ações da Loja&rdquo; na home pública.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="a-titulo">Título *</Label>
                <Input
                  id="a-titulo"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex.: Entrega de cestas — Campanha do Oriente"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="a-desc">Texto</Label>
                <Textarea
                  id="a-desc"
                  rows={4}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Conte o que aconteceu, para quem e o impacto..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Onde publicar *</Label>
                  <Select
                    value={entidade}
                    onValueChange={(v) => setEntidade((v ?? "loja") as EntidadeId)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTIDADES.map((ent) => (
                        <SelectItem key={ent.id} value={ent.id}>
                          {ent.nomeCurto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select
                    value={categoria}
                    onValueChange={(v) => setCategoria((v ?? "ACAO") as CategoriaTrabalho)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATS_PUBLICAS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORIA_TRABALHO_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Fotos</Label>
                <label
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 cursor-pointer hover:bg-muted/40 transition-colors",
                    files.length > 0 && "border-primary/40 bg-primary/5"
                  )}
                >
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    {files.length > 0
                      ? `${files.length} arquivo(s)`
                      : "Clique para escolher fotos (até 12)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => onPickFiles(e.target.files)}
                  />
                </label>
                {previews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {previews.map((src, i) => (
                      <div key={src} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                          onClick={() => {
                            setFiles((prev) => prev.filter((_, idx) => idx !== i));
                            setPreviews((prev) => {
                              URL.revokeObjectURL(prev[i]);
                              return prev.filter((_, idx) => idx !== i);
                            });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Publicar no site
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!uploadTarget} onOpenChange={(o) => !o && setUploadTarget(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Adicionar fotos</DialogTitle>
            <DialogDescription>{uploadTarget?.titulo}</DialogDescription>
          </DialogHeader>
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 cursor-pointer hover:bg-muted/40">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {uploading ? "Enviando..." : "Selecionar fotos"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleAddMidias(e.target.files)}
            />
          </label>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Remover do site?</DialogTitle>
            <DialogDescription>
              A ação some da home pública imediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="gap-1.5">
              <Trash2 className="h-4 w-4" /> Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
