"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Globe,
  ImagePlus,
  Loader2,
  Lock,
  Plus,
  Trash2,
  Upload,
  Users,
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
import { Switch } from "@/components/ui/switch";
import {
  CATEGORIA_TRABALHO_LABELS,
  GRAU_MINIMO_LABELS,
  adicionarMidiasTrabalho,
  criarTrabalho,
  excluirTrabalho,
  getNivelAcessoUsuario,
  getTrabalhos,
  podeVerTrabalho,
  type CategoriaTrabalho,
  type GrauMinimo,
  type Trabalho,
} from "@/lib/trabalhos-store";
import { cn } from "@/lib/utils";

const CATEGORIAS = Object.keys(CATEGORIA_TRABALHO_LABELS) as CategoriaTrabalho[];

export default function TrabalhosPage() {
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
  const [grauMinimo, setGrauMinimo] = useState<GrauMinimo>(0);
  const [publico, setPublico] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const nivel = useMemo(() => getNivelAcessoUsuario(), []);

  const reload = useCallback(async () => {
    const all = await getTrabalhos();
    setLista(all.filter((t) => podeVerTrabalho(t, nivel)));
    setLoading(false);
  }, [nivel]);

  useEffect(() => {
    reload();
  }, [reload]);

  function resetForm() {
    setTitulo("");
    setDescricao("");
    setCategoria("ACAO");
    setGrauMinimo(0);
    setPublico(true);
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
        grauMinimo,
        publico: grauMinimo === 0 ? publico : false,
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
    setError(null);
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Trabalhos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Fotos, ações da Loja e documentação. Controle o que vai ao site público e o que fica restrito por grau.
          </p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          Novo trabalho
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {lista.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum trabalho publicado ainda.</p>
            <p className="text-xs text-muted-foreground">
              Clique em &ldquo;Novo trabalho&rdquo; para subir fotos e ações da Loja.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((t) => (
            <Card key={t.id} className="overflow-hidden flex flex-col">
              <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                {t.capaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.capaUrl} alt={t.titulo} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <BookOpen className="h-10 w-10 opacity-40" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px] backdrop-blur-sm">
                    {CATEGORIA_TRABALHO_LABELS[t.categoria]}
                  </Badge>
                  {t.publico && t.grauMinimo === 0 ? (
                    <Badge className="text-[10px] gap-1 bg-emerald-600/90">
                      <Globe className="h-3 w-3" /> Site
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] gap-1 bg-background/80">
                      <Lock className="h-3 w-3" />
                      {GRAU_MINIMO_LABELS[t.grauMinimo]}
                    </Badge>
                  )}
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-1">{t.titulo}</CardTitle>
                {t.descricao && (
                  <CardDescription className="line-clamp-2">{t.descricao}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0 mt-auto space-y-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {t.midias.length} mídia{t.midias.length !== 1 ? "s" : ""}
                  {t.criadoPor ? ` · ${t.criadoPor}` : ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => setUploadTarget(t)}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Fotos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(t)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" showCloseButton>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Novo trabalho</DialogTitle>
              <DialogDescription>
                Suba fotos ou documentos. Defina se aparece no site público ou só para irmãos por grau.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="t-titulo">Título *</Label>
                <Input id="t-titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Ação social — doação de cestas" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="t-desc">Descrição</Label>
                <Textarea id="t-desc" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Contexto da ação ou do trabalho..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select value={categoria} onValueChange={(v) => setCategoria((v ?? "ACAO") as CategoriaTrabalho)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((c) => (
                        <SelectItem key={c} value={c}>{CATEGORIA_TRABALHO_LABELS[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Visibilidade</Label>
                  <Select
                    value={String(grauMinimo)}
                    onValueChange={(v) => {
                      const g = Number(v) as GrauMinimo;
                      setGrauMinimo(g);
                      if (g !== 0) setPublico(false);
                    }}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {([0, 1, 2, 3] as GrauMinimo[]).map((g) => (
                        <SelectItem key={g} value={String(g)}>{GRAU_MINIMO_LABELS[g]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {grauMinimo === 0 && (
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Publicar no site</p>
                    <p className="text-xs text-muted-foreground">Aparece na vitrine institucional sem login</p>
                  </div>
                  <Switch checked={publico} onCheckedChange={setPublico} />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Fotos / arquivos</Label>
                <label
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 cursor-pointer hover:bg-muted/40 transition-colors",
                    files.length > 0 && "border-primary/40 bg-primary/5"
                  )}
                >
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    {files.length > 0 ? `${files.length} arquivo(s) selecionado(s)` : "Clique ou arraste imagens (até 12)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf,video/*"
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
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Publicar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add media */}
      <Dialog open={!!uploadTarget} onOpenChange={(o) => !o && setUploadTarget(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Adicionar fotos</DialogTitle>
            <DialogDescription>
              {uploadTarget?.titulo} — as imagens serão comprimidas antes do envio.
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 cursor-pointer hover:bg-muted/40">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {uploading ? "Enviando..." : "Selecionar arquivos"}
            </span>
            <input
              type="file"
              accept="image/*,application/pdf,video/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleAddMidias(e.target.files)}
            />
          </label>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Excluir trabalho?</DialogTitle>
            <DialogDescription>
              Remove o registro. Os arquivos no Cloudinary permanecem (limpeza futura).
            </DialogDescription>
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
