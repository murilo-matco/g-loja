"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ImageIcon, Loader2 } from "lucide-react";
import {
  CATEGORIA_TRABALHO_LABELS,
  getTrabalho,
  type Trabalho,
} from "@/lib/trabalhos-store";

export default function AcaoPublicaPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<Trabalho | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    getTrabalho(params.id).then((t) => {
      if (t && t.publico && t.grauMinimo === 0) setItem(t);
      setLoading(false);
    });
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#0c1222]">
        <Loader2 className="h-8 w-8 animate-spin text-[#c4a35a]" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#0c1222] text-[#f3e9d0] px-4">
        <p className="text-[#f3e9d0]/70">Ação não encontrada ou não é pública.</p>
        <Link href="/" className="text-[#c4a35a] hover:underline text-sm">
          Voltar ao site
        </Link>
      </div>
    );
  }

  const fotos = item.midias.filter((m) => m.tipo === "image");

  return (
    <div className="bg-[#0c1222] text-[#f3e9d0] min-h-full pt-24 pb-16 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/#acoes"
          className="inline-flex items-center gap-1.5 text-sm text-[#f3e9d0]/60 hover:text-[#c4a35a] mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar às ações
        </Link>

        <p className="text-[11px] tracking-widest uppercase text-[#c4a35a] mb-3">
          {CATEGORIA_TRABALHO_LABELS[item.categoria]}
        </p>
        <h1
          className="text-3xl sm:text-5xl leading-tight mb-4"
          style={{ fontFamily: "var(--font-site-display), serif" }}
        >
          {item.titulo}
        </h1>
        {item.descricao && (
          <p className="text-[#f3e9d0]/75 text-base sm:text-lg leading-relaxed max-w-2xl mb-10 whitespace-pre-wrap">
            {item.descricao}
          </p>
        )}

        {fotos.length === 0 ? (
          <div className="rounded-sm border border-white/10 py-20 text-center">
            <ImageIcon className="h-10 w-10 mx-auto text-[#c4a35a]/40 mb-3" />
            <p className="text-sm text-[#f3e9d0]/50">Sem fotos nesta ação.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {fotos.map((m) => (
              <button
                key={m.url}
                type="button"
                className="aspect-[4/3] overflow-hidden rounded-sm border border-white/8 bg-[#121a2e] text-left"
                onClick={() => setLightbox(m.url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt={m.nome}
                  className="h-full w-full object-cover hover:scale-[1.02] transition-transform duration-500"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-h-full max-w-full object-contain" />
        </button>
      )}
    </div>
  );
}
