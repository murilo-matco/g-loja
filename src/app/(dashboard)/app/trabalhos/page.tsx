"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ImagePlus,
  Loader2,
  Lock,
  Plus,
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
  GRAU_MINIMO_LABELS,
  adicionarMidiasTrabalho,
  criarTrabalho,
  excluirTrabalho,
  getNivelAcessoUsuario,
  getTrabalhosInternos,
  type CategoriaTrabalho,
  type GrauMinimo,
  type Trabalho,
} from "@/lib/trabalhos-store";
import { cn } from "@/lib/utils";

const CATS: CategoriaTrabalho[] = ["TRABALHO", "DOCUMENTO", "FOTO", "OUTRO"];

export default function TrabalhosInternosPage() {
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
  const [categoria, setCategoria] = useState<CategoriaTrabalho>("TRABALHO");
  const [grauMinimo, setGrauMinimo] = useState<GrauMinimo>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const nivel = useMemo(() => getNivelAcessoUsuario(), []);

  const reload = useCallback(async () => {
    setLista(await getTrabalhosInternos());
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function resetForm() {
    setTitulo("");
    setDescricao("");
    setCategoria("TRABALHO");
    setGrauMinimo(1);
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
      await criarTrabalho({
        titulo,
        descricao,
        categoria,
        grauMinimo: grauMinimo < 1 ? 1 : grauMinimo,
        publico: false,
        files,
      });
      setDialogOpen(false);
      resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Trabalhos da Loja
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">
            Arquivo interno: peças, documentos e fotos por grau.{" "}
            <strong>Não aparecem no site público.</strong> Aprendiz vê só grau 1+;
            Companheiro 2+; Mestre vê tudo.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Seu nível de acesso:{" "}
            <Badge variant="outline" className="ml-1">
              {nivel >= 3 ? "Mestre" : nivel === 2 ? "Companheiro" : "Aprendiz"}
            </Badge>
          </p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          Novo trabalho
        </Button>
      </div>

      <p className="text-xs text-muted-foreground rounded-lg border bg-muted/30 px-3 py-2">
        Quer publicar no site institucional? Use{" "}
        <Link href="/app/acoes" className="text-primary font-medium hover:underline">
          Ações no site
        </Link>
        .
      </p>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {lista.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-3">
            <Lock className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">Nenhum trabalho interno no seu grau ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((t) => (
            <Card key={t.id} className="overflow-hidden flex flex-col">
              <div className="aspect-[16/10] bg-muted relative">
                {t.capaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.capaUrl} alt={t.titulo} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
                <Badge variant="outline" className="absolute top-2 left-2 gap-1 text-[10px] bg-background/90">
                  <Lock className="h-3 w-3" />
                  {GRAU_MINIMO_LABELS[t.grauMinimo]}
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-1">{t.titulo}</CardTitle>
                {t.descricao && (
                  <CardDescription className="line-clamp-2">{t.descricao}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0 mt-auto flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setUploadTarget(t)}>
                  <Upload className="h-3.5 w-3.5" /> Arquivos
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

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" showCloseButton>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Novo trabalho interno</DialogTitle>
              <DialogDescription>
                Restrito por grau. Não vai para o site público.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Título *</Label>
                <Input required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Peça de arquitetura — 1º grau" />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select value={categoria} onValueChange={(v) => setCategoria((v ?? "TRABALHO") as CategoriaTrabalho)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATS.map((c) => (
                        <SelectItem key={c} value={c}>{CATEGORIA_TRABALHO_LABELS[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Grau mínimo</Label>
                  <Select value={String(grauMinimo)} onValueChange={(v) => setGrauMinimo(Number(v) as GrauMinimo)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {([1, 2, 3] as GrauMinimo[]).map((g) => (
                        <SelectItem key={g} value={String(g)}>{GRAU_MINIMO_LABELS[g]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Arquivos / fotos</Label>
                <label
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 cursor-pointer hover:bg-muted/40",
                    files.length > 0 && "border-primary/40 bg-primary/5"
                  )}
                >
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {files.length > 0 ? `${files.length} arquivo(s)` : "Selecionar (até 12)"}
                  </span>
                  <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => onPickFiles(e.target.files)} />
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
                            setFiles((p) => p.filter((_, idx) => idx !== i));
                            setPreviews((p) => {
                              URL.revokeObjectURL(p[i]);
                              return p.filter((_, idx) => idx !== i);
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
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Salvar interno
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!uploadTarget} onOpenChange={(o) => !o && setUploadTarget(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Adicionar arquivos</DialogTitle>
            <DialogDescription>{uploadTarget?.titulo}</DialogDescription>
          </DialogHeader>
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 cursor-pointer hover:bg-muted/40">
            {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">{uploading ? "Enviando..." : "Selecionar"}</span>
            <input type="file" accept="image/*,application/pdf" multiple className="hidden" disabled={uploading} onChange={(e) => handleAddMidias(e.target.files)} />
          </label>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Excluir trabalho?</DialogTitle>
            <DialogDescription>Remove o registro interno.</DialogDescription>
          </DialogHeader>
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
