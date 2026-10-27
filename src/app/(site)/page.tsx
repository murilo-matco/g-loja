"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ImageIcon, Loader2 } from "lucide-react";
import {
  CATEGORIA_TRABALHO_LABELS,
  getTrabalhosPublicos,
  type Trabalho,
} from "@/lib/trabalhos-store";

export default function SiteHomePage() {
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrabalhosPublicos()
      .then(setTrabalhos)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#0c1222] text-[#f3e9d0]">
      {/* Hero — full bleed */}
      <section className="relative min-h-[100svh] flex items-end overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 70% 20%, #1a2744 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 10% 80%, #162033 0%, transparent 50%), linear-gradient(165deg, #0c1222 0%, #121a2e 45%, #0a0f1a 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c4a35a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 pt-28">
          <p
            className="text-[#c4a35a] text-sm tracking-[0.25em] uppercase mb-4 animate-in fade-in duration-700"
            style={{ fontFamily: "var(--font-site-display), serif" }}
          >
            Oriente · Memória · Trabalho
          </p>
          <h1
            className="text-5xl sm:text-7xl md:text-8xl font-semibold leading-[0.95] max-w-3xl text-[#f3e9d0] animate-in fade-in slide-in-from-bottom-4 duration-1000"
            style={{ fontFamily: "var(--font-site-display), serif" }}
          >
            G-Loja
          </h1>
          <p className="mt-6 max-w-xl text-base sm:text-lg text-[#f3e9d0]/75 leading-relaxed animate-in fade-in duration-1000 delay-150">
            Espaço institucional da Loja: ações sociais, registros fotográficos e
            a memória dos trabalhos que construímos juntos.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 animate-in fade-in duration-1000 delay-300">
            <a
              href="#acoes"
              className="inline-flex items-center gap-2 rounded-sm bg-[#c4a35a] text-[#0c1222] px-5 py-2.5 text-sm font-semibold hover:bg-[#d4b56a] transition-colors"
            >
              Ver ações
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-sm border border-[#f3e9d0]/25 px-5 py-2.5 text-sm text-[#f3e9d0] hover:border-[#c4a35a]/60 hover:text-[#c4a35a] transition-colors"
            >
              Área do Irmão
            </Link>
          </div>
        </div>
      </section>

      {/* Ações públicas */}
      <section id="acoes" className="scroll-mt-8 py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 sm:mb-14 max-w-2xl">
            <h2
              className="text-3xl sm:text-4xl text-[#f3e9d0]"
              style={{ fontFamily: "var(--font-site-display), serif" }}
            >
              Ações da Loja
            </h2>
            <p className="mt-3 text-[#f3e9d0]/65 text-sm sm:text-base leading-relaxed">
              O que liberamos ao público: fotos, eventos e trabalhos abertos.
              Conteúdo de grau permanece restrito aos irmãos.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#c4a35a]" />
            </div>
          ) : trabalhos.length === 0 ? (
            <div className="rounded-sm border border-white/10 bg-white/[0.03] py-20 text-center">
              <ImageIcon className="h-10 w-10 mx-auto text-[#c4a35a]/40 mb-4" />
              <p className="text-[#f3e9d0]/60 text-sm">
                Em breve publicaremos as primeiras ações aqui.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trabalhos.map((t, i) => (
                <article
                  key={t.id}
                  className="group overflow-hidden rounded-sm border border-white/8 bg-white/[0.03] hover:border-[#c4a35a]/35 transition-colors"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="aspect-[16/10] overflow-hidden bg-[#121a2e]">
                    {t.capaUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.capaUrl}
                        alt={t.titulo}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-[#c4a35a]/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-2">
                    <p className="text-[11px] tracking-widest uppercase text-[#c4a35a]">
                      {CATEGORIA_TRABALHO_LABELS[t.categoria]}
                    </p>
                    <h3
                      className="text-xl text-[#f3e9d0] leading-snug"
                      style={{ fontFamily: "var(--font-site-display), serif" }}
                    >
                      {t.titulo}
                    </h3>
                    {t.descricao && (
                      <p className="text-sm text-[#f3e9d0]/60 line-clamp-3 leading-relaxed">
                        {t.descricao}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="scroll-mt-8 border-t border-white/5 py-16 sm:py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1.2fr_1fr] items-center">
          <div>
            <h2
              className="text-3xl sm:text-4xl text-[#f3e9d0]"
              style={{ fontFamily: "var(--font-site-display), serif" }}
            >
              Para o público e para a Loja
            </h2>
            <p className="mt-4 text-[#f3e9d0]/65 leading-relaxed max-w-xl">
              Este site mostra o que a Loja escolhe compartilhar. Irmãos entram
              pela Área do Irmão para gestão, presença, finanças e trabalhos
              internos — com restrição por grau (Aprendiz, Companheiro, Mestre).
            </p>
          </div>
          <div className="rounded-sm border border-[#c4a35a]/25 bg-[#c4a35a]/08 p-6 sm:p-8">
            <p
              className="text-2xl text-[#c4a35a] mb-3"
              style={{ fontFamily: "var(--font-site-display), serif" }}
            >
              Você é membro?
            </p>
            <p className="text-sm text-[#f3e9d0]/70 mb-5 leading-relaxed">
              Acesse o painel com CPF ou CNPJ. Login permanece como barreira de
              segurança por enquanto.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0c1222] bg-[#c4a35a] px-4 py-2.5 rounded-sm hover:bg-[#d4b56a] transition-colors"
            >
              Entrar na Área do Irmão
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
