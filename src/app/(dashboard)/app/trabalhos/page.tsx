"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  ImagePlus,
  Loader2,
  Lock,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cloudinaryPdfPageUrl, isCloudinaryPdf } from "@/lib/pdf-cloudinary";
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
  type MidiaTrabalho,
  type Trabalho,
} from "@/lib/trabalhos-store";
import { getSession } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

const CATS: CategoriaTrabalho[] = ["TRABALHO", "DOCUMENTO", "FOTO", "OUTRO"];

/** Força download no Cloudinary (útil no celular). */
function urlDownload(url: string, nome?: string) {
  if (!url.includes("cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  const withFlag = url.replace("/upload/", "/upload/fl_attachment/");
  if (nome) {
    try {
      const u = new URL(withFlag);
      u.searchParams.set("filename", nome);
      return u.toString();
    } catch {
      return withFlag;
    }
  }
  return withFlag;
}

function MidiaIcon({ tipo }: { tipo: MidiaTrabalho["tipo"] }) {
  if (tipo === "image") return <ImageIcon className="h-5 w-5 text-sky-600 shrink-0" />;
  return <FileText className="h-5 w-5 text-rose-600 shrink-0" />;
}

export default function TrabalhosInternosPage() {
  const [lista, setLista] = useState<Trabalho[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Trabalho | null>(null);
  const [uploadTarget, setUploadTarget] = useState<Trabalho | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aberto, setAberto] = useState<Trabalho | null>(null);
  const [lightbox, setLightbox] = useState<MidiaTrabalho | null>(null);
  const [pdfView, setPdfView] = useState<MidiaTrabalho | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfErro, setPdfErro] = useState<string | null>(null);
  /** null = hub com as 3 pastas de grau; 1|2|3 = lista daquela pasta */
  const [grauAberto, setGrauAberto] = useState<1 | 2 | 3 | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<CategoriaTrabalho>("TRABALHO");
  const [grauMinimo, setGrauMinimo] = useState<GrauMinimo>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const nivel = useMemo(() => getNivelAcessoUsuario(), []);
  const podeGerenciar = useMemo(() => {
    const s = getSession();
    return Boolean(s && s.cargo !== "MEMBRO");
  }, []);

  const reload = useCallback(async () => {
    setLista(await getTrabalhosInternos());
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const secoes = useMemo(() => {
    const defs: { grau: 1 | 2 | 3; titulo: string; sub: string }[] = [
      { grau: 1, titulo: "Aprendizes", sub: "1º grau" },
      { grau: 2, titulo: "Companheiros", sub: "2º grau" },
      { grau: 3, titulo: "Mestres", sub: "3º grau" },
    ];
    return defs
      .filter((s) => nivel >= s.grau)
      .map((s) => ({
        ...s,
        itens: lista.filter((t) => t.grauMinimo === s.grau),
      }));
  }, [lista, nivel]);

  const pdfPageSrc = useMemo(() => {
    if (!pdfView) return null;
    return cloudinaryPdfPageUrl(pdfView.url, pdfPage);
  }, [pdfView, pdfPage]);

  const listaGrau = useMemo(() => {
    if (!grauAberto) return [];
    return lista.filter((t) => t.grauMinimo === grauAberto);
  }, [lista, grauAberto]);

  const secaoAtual = secoes.find((s) => s.grau === grauAberto);

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
    if (aberto?.id === deleteTarget.id) setAberto(null);
    await reload();
  }

  async function handleAddMidias(selected: FileList | null) {
    if (!uploadTarget || !selected?.length) return;
    setUploading(true);
    try {
      await adicionarMidiasTrabalho(uploadTarget.id, Array.from(selected).slice(0, 12));
      setUploadTarget(null);
      await reload();
      const atualizada = (await getTrabalhosInternos()).find((t) => t.id === uploadTarget.id);
      if (atualizada) setAberto(atualizada);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  function abrirMidia(m: MidiaTrabalho) {
    if (m.tipo === "image" && !isCloudinaryPdf(m.url, m.tipo)) {
      setLightbox(m);
      return;
    }
    if (isCloudinaryPdf(m.url, m.tipo)) {
      setPdfErro(null);
      setPdfPage(1);
      setPdfLoading(true);
      setPdfView(m);
      return;
    }
    window.open(m.url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg md:max-w-3xl space-y-4 pb-8">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary shrink-0" />
              Trabalhos
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {grauAberto
                ? "Toque numa pasta para ver e baixar os arquivos."
                : "Escolha o grau: Aprendizes, Companheiros ou Mestres."}{" "}
              <span className="whitespace-nowrap">
                Seu acesso:{" "}
                <Badge variant="outline" className="align-middle">
                  {nivel >= 3 ? "Mestre" : nivel === 2 ? "Companheiro" : "Aprendiz"}
                </Badge>
              </span>
            </p>
          </div>
          {podeGerenciar && !grauAberto && (
            <Button
              size="sm"
              className="gap-1.5 shrink-0 h-10"
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          )}
        </div>

        {podeGerenciar && !grauAberto && (
          <p className="text-xs text-muted-foreground rounded-lg border bg-muted/30 px-3 py-2">
            Site público ={" "}
            <Link href="/app/acoes" className="text-primary font-medium hover:underline">
              Ações no site
            </Link>
            . Aqui é só interno.
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Hub: 3 pastas de grau */}
      {!grauAberto && (
        <div className="grid gap-3">
          {secoes.length === 0 ? (
            <div className="rounded-xl border bg-card py-14 text-center space-y-3 px-4">
              <Lock className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">Nenhum grau disponível no seu acesso.</p>
            </div>
          ) : (
            <ul className="rounded-xl border bg-card divide-y overflow-hidden">
              {secoes.map((s) => (
                <li key={s.grau}>
                  <button
                    type="button"
                    onClick={() => setGrauAberto(s.grau)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-muted/50 hover:bg-muted/30 transition-colors min-h-[60px]"
                  >
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-[15px]">{s.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.sub} · {s.itens.length} pasta{s.itens.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Lista dentro do grau */}
      {grauAberto && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setGrauAberto(null)}
            className="inline-flex items-center gap-1.5 text-sm text-primary font-medium py-1"
          >
            ← Voltar aos graus
          </button>
          <h2 className="text-lg font-semibold">{secaoAtual?.titulo ?? "Grau"}</h2>
          {listaGrau.length === 0 ? (
            <div className="rounded-xl border bg-card py-14 text-center space-y-3 px-4">
              <Lock className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">Nenhuma pasta neste grau ainda.</p>
            </div>
          ) : (
            <ul className="rounded-xl border bg-card divide-y overflow-hidden">
              {listaGrau.map((t) => {
                const n = t.midias?.length ?? 0;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setAberto(t)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-muted/60 hover:bg-muted/40 transition-colors min-h-[64px]"
                    >
                      <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                        {t.capaUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.capaUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base leading-snug line-clamp-2">
                          {t.titulo.replace(/^\[(APRENDIZES|COMPANHEIROS|MESTRES)\]\s*/i, "")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {n} arquivo{n === 1 ? "" : "s"}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Detalhe da pasta — full-ish no mobile */}
      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent
          className="p-0 gap-0 max-w-lg w-[100vw] sm:w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-xl flex flex-col"
          showCloseButton={false}
        >
          <div className="flex items-center gap-2 px-3 py-3 border-b shrink-0 sticky top-0 bg-background z-10">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setAberto(null)}
              aria-label="Voltar"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base leading-snug line-clamp-2">
                {aberto?.titulo.replace(/^\[(APRENDIZES|COMPANHEIROS|MESTRES)\]\s*/i, "")}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {aberto ? `${aberto.midias.length} arquivo(s)` : ""}
              </DialogDescription>
            </div>
            {podeGerenciar && aberto && (
              <div className="flex gap-1 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setUploadTarget(aberto)}
                  aria-label="Adicionar"
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 text-destructive"
                  onClick={() => setDeleteTarget(aberto)}
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {aberto?.descricao && (
              <p className="text-xs text-muted-foreground px-4 pt-3 pb-1">{aberto.descricao}</p>
            )}
            {!aberto?.midias?.length ? (
              <p className="text-sm text-muted-foreground text-center py-12 px-4">
                Sem arquivos nesta pasta.
              </p>
            ) : (
              <ul className="divide-y">
                {aberto.midias.map((m, i) => (
                  <li key={`${m.url}-${i}`} className="flex items-stretch">
                    <button
                      type="button"
                      onClick={() => abrirMidia(m)}
                      className="flex-1 flex items-center gap-3 px-4 py-3.5 text-left min-h-[56px] active:bg-muted/50 hover:bg-muted/30"
                    >
                      <MidiaIcon tipo={m.tipo} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{m.nome || `Arquivo ${i + 1}`}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {m.tipo === "image" && !isCloudinaryPdf(m.url, m.tipo)
                            ? "Imagem · tocar para ver"
                            : "PDF · tocar para ler"}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                    <a
                      href={
                        isCloudinaryPdf(m.url, m.tipo)
                          ? cloudinaryPdfPageUrl(m.url, 1) ?? m.url
                          : urlDownload(m.url, m.nome)
                      }
                      download={
                        isCloudinaryPdf(m.url, m.tipo)
                          ? `${m.nome || "documento"}-p1.png`
                          : m.nome || true
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-4 border-l min-w-[52px] text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      aria-label="Baixar"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Download className="h-5 w-5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox imagem */}
      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent
          className="p-0 gap-0 max-w-[100vw] w-[100vw] h-[100dvh] rounded-none border-0 bg-black/95"
          showCloseButton={false}
        >
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-2 safe-top">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-white hover:bg-white/10"
              onClick={() => setLightbox(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            {lightbox && (
              <a
                href={urlDownload(lightbox.url, lightbox.nome)}
                download={lightbox.nome || true}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md text-white hover:bg-white/10"
              >
                <Download className="h-5 w-5" />
              </a>
            )}
          </div>
          {lightbox && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={lightbox.url}
              alt={lightbox.nome}
              className="h-full w-full object-contain p-2 pt-14 pb-8"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Leitor de PDF (páginas via Cloudinary — contorna bloqueio 401 do free) */}
      <Dialog
        open={!!pdfView}
        onOpenChange={(o) => {
          if (!o) {
            setPdfView(null);
            setPdfErro(null);
          }
        }}
      >
        <DialogContent
          className="p-0 gap-0 max-w-[100vw] w-[100vw] h-[100dvh] rounded-none border-0 bg-zinc-950 flex flex-col"
          showCloseButton={false}
        >
          <div className="flex items-center gap-2 px-2 py-2 border-b border-white/10 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/10"
              onClick={() => setPdfView(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            <p className="text-white text-sm font-medium truncate flex-1 min-w-0">
              {pdfView?.nome ?? "PDF"}
            </p>
            {pdfPageSrc && (
              <a
                href={pdfPageSrc}
                download={`${pdfView?.nome ?? "pagina"}-p${pdfPage}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10"
                aria-label="Baixar página"
              >
                <Download className="h-4 w-4" />
              </a>
            )}
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center p-2 relative min-h-0">
            {pdfLoading && !pdfErro && (
              <Loader2 className="h-8 w-8 animate-spin text-white/70 absolute" />
            )}
            {pdfErro ? (
              <div className="text-center px-6 max-w-sm space-y-3">
                <FileText className="h-10 w-10 text-white/40 mx-auto" />
                <p className="text-sm text-white/80">{pdfErro}</p>
                <p className="text-xs text-white/50">
                  No Cloudinary (grátis), PDF direto fica bloqueado. Estamos corrigindo os arquivos
                  antigos para leitura por página.
                </p>
              </div>
            ) : pdfPageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={pdfPageSrc}
                src={pdfPageSrc}
                alt={`Página ${pdfPage}`}
                className={cn(
                  "max-h-full max-w-full object-contain rounded-sm shadow-lg bg-white",
                  pdfLoading && "opacity-0"
                )}
                onLoad={() => {
                  setPdfLoading(false);
                  setPdfErro(null);
                }}
                onError={() => {
                  setPdfLoading(false);
                  if (pdfPage > 1) {
                    setPdfPage((p) => Math.max(1, p - 1));
                    setPdfErro("Fim do documento.");
                  } else {
                    setPdfErro(
                      "Não foi possível abrir este PDF. Arquivo ainda no formato antigo bloqueado."
                    );
                  }
                }}
              />
            ) : null}
          </div>

          <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-white/10 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-10 gap-1"
              disabled={pdfPage <= 1 || pdfLoading}
              onClick={() => {
                setPdfErro(null);
                setPdfLoading(true);
                setPdfPage((p) => Math.max(1, p - 1));
              }}
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <span className="text-white/80 text-sm tabular-nums min-w-[4.5rem] text-center">
              Pág. {pdfPage}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-10 gap-1"
              disabled={pdfLoading || !!pdfErro}
              onClick={() => {
                setPdfErro(null);
                setPdfLoading(true);
                setPdfPage((p) => p + 1);
              }}
            >
              Próxima <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {podeGerenciar && (
        <>
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
                  <DialogTitle>Novo trabalho interno</DialogTitle>
                  <DialogDescription>Restrito por grau. Não vai para o site público.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label>Título *</Label>
                    <Input
                      required
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ex.: Peça de arquitetura — 1º grau"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Descrição</Label>
                    <Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Categoria</Label>
                      <Select
                        value={categoria}
                        onValueChange={(v) => setCategoria((v ?? "TRABALHO") as CategoriaTrabalho)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATS.map((c) => (
                            <SelectItem key={c} value={c}>
                              {CATEGORIA_TRABALHO_LABELS[c]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Grau mínimo</Label>
                      <Select
                        value={String(grauMinimo)}
                        onValueChange={(v) => setGrauMinimo(Number(v) as GrauMinimo)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {([1, 2, 3] as GrauMinimo[]).map((g) => (
                            <SelectItem key={g} value={String(g)}>
                              {GRAU_MINIMO_LABELS[g]}
                            </SelectItem>
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
                      <input
                        type="file"
                        accept="image/*,application/pdf"
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
              <label className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 cursor-pointer hover:bg-muted/40 min-h-[120px]">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploading ? "Enviando..." : "Selecionar"}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
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
                <DialogTitle>Excluir trabalho?</DialogTitle>
                <DialogDescription>Remove o registro interno.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDelete} className="gap-1.5">
                  <Trash2 className="h-4 w-4" /> Excluir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
