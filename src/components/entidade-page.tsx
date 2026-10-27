"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ImageIcon, Loader2, Lock } from "lucide-react";
import {
  CATEGORIA_TRABALHO_LABELS,
  getTrabalhosPublicos,
  type Trabalho,
} from "@/lib/trabalhos-store";
import { getEntidade, type EntidadeId } from "@/lib/entidades";

export function EntidadePage({ entidadeId }: { entidadeId: EntidadeId }) {
  const e = getEntidade(entidadeId);
  const [itens, setItens] = useState<Trabalho[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrabalhosPublicos(undefined, entidadeId)
      .then(setItens)
      .finally(() => setLoading(false));
  }, [entidadeId]);

  return (
    <div className="bg-[#0b1220] text-[#f3e9d0] min-h-full">
      <section
        className="relative pt-28 pb-14 px-4 sm:px-6 overflow-hidden"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 80% 0%, ${e.cor}55 0%, transparent 55%), linear-gradient(160deg, #0b1220 0%, #121a2e 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#f3e9d0]/55 hover:text-[#f3e9d0] mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Portal
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            {e.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={e.logo}
                alt={e.nome}
                className="h-28 w-28 sm:h-36 sm:w-36 rounded-full object-cover shadow-xl border-2 border-white/20 shrink-0"
              />
            )}
            <div className="min-w-0">
              <p
                className="text-xs tracking-[0.2em] uppercase mb-2"
                style={{ color: e.corSuave }}
              >
                {e.nomeCurto}
              </p>
              <h1
                className="text-3xl sm:text-5xl font-semibold leading-tight"
                style={{ fontFamily: "var(--font-site-display), serif" }}
              >
                {e.nome}
              </h1>
              <p className="mt-3 text-[#f3e9d0]/70 max-w-2xl text-sm sm:text-base leading-relaxed">
                {e.descricao}
              </p>
            </div>
          </div>

          {entidadeId === "loja" && (
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                { grau: "Aprendizes", nivel: 1, pasta: "APRENDIZES" },
                { grau: "Companheiros", nivel: 2, pasta: "COMPANHEIROS" },
                { grau: "Mestres", nivel: 3, pasta: "MESTRES" },
              ].map((g) => (
                <Link
                  key={g.pasta}
                  href="/login"
                  className="rounded-sm border border-white/10 bg-white/[0.04] px-4 py-4 hover:border-[#c4a35a]/40 transition-colors group"
                >
                  <div className="flex items-center gap-2 text-[#c4a35a] text-xs uppercase tracking-wider mb-1">
                    <Lock className="h-3.5 w-3.5" />
                    Pasta {g.pasta}
                  </div>
                  <p
                    className="text-lg text-[#f3e9d0] group-hover:text-[#c4a35a] transition-colors"
                    style={{ fontFamily: "var(--font-site-display), serif" }}
                  >
                    {g.grau}
                  </p>
                  <p className="text-xs text-[#f3e9d0]/50 mt-1">
                    Acesso restrito — Área do Irmão
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 sm:px-6 py-14 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <h2
            className="text-2xl sm:text-3xl mb-8"
            style={{ fontFamily: "var(--font-site-display), serif" }}
          >
            Publicações
          </h2>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: e.corSuave }} />
            </div>
          ) : itens.length === 0 ? (
            <div className="rounded-sm border border-dashed border-white/15 py-16 text-center px-4">
              <ImageIcon className="h-10 w-10 mx-auto opacity-30 mb-3" style={{ color: e.corSuave }} />
              <p className="text-sm text-[#f3e9d0]/55">
                Ainda não há publicações desta entidade no site.
              </p>
              <p className="text-xs text-[#f3e9d0]/35 mt-2">
                Comissão de Gestão: publique em Área do Irmão → Ações no site → escolha{" "}
                {e.nomeCurto}.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {itens.map((t) => (
                <Link
                  key={t.id}
                  href={`/acao/${t.id}`}
                  className="group overflow-hidden rounded-sm border border-white/8 bg-white/[0.03] hover:border-white/25 transition-colors"
                >
                  <div className="aspect-[16/10] bg-[#121a2e] overflow-hidden">
                    {t.capaUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.capaUrl}
                        alt={t.titulo}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center opacity-30">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-2">
                    <p className="text-[11px] tracking-widest uppercase" style={{ color: e.corSuave }}>
                      {CATEGORIA_TRABALHO_LABELS[t.categoria]}
                    </p>
                    <h3
                      className="text-xl leading-snug"
                      style={{ fontFamily: "var(--font-site-display), serif" }}
                    >
                      {t.titulo}
                    </h3>
                    {t.descricao && (
                      <p className="text-sm text-[#f3e9d0]/60 line-clamp-3">{t.descricao}</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs pt-1" style={{ color: e.corSuave }}>
                      Ver mais <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
