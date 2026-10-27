"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ENTIDADES, PORTAL } from "@/lib/entidades";
import { SiteIrmaoLink } from "@/components/site-irmao-link";

export default function PortalHomePage() {
  return (
    <div className="bg-[#0b1220] text-[#f3e9d0]">
      {/* Hero */}
      <section className="relative min-h-[100svh] flex items-end overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 75% 15%, #0ea5e933 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 15% 70%, #1e3a5f66 0%, transparent 50%), linear-gradient(165deg, #0b1220 0%, #121a2e 50%, #070b14 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-14 sm:pb-20 pt-28">
          <p
            className="text-[#0ea5e9] text-sm tracking-[0.22em] uppercase mb-4"
            style={{ fontFamily: "var(--font-site-display), serif" }}
          >
            Portal eletrônico · {PORTAL.oriente}
          </p>
          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-semibold leading-[0.98] max-w-3xl"
            style={{ fontFamily: "var(--font-site-display), serif" }}
          >
            {PORTAL.nome}
          </h1>
          <p className="mt-5 max-w-xl text-base sm:text-lg text-[#f3e9d0]/70 leading-relaxed">
            Um canal para a Loja, a Associação Beneficente e a Fraternidade Feminina —
            eventos, comunicados e memória, cada um no seu espaço.
          </p>
          <p className="mt-8 text-xs text-[#f3e9d0]/45 tracking-wide">
            Escolha por onde deseja navegar
          </p>
        </div>
      </section>

      {/* Três entidades */}
      <section id="entidades" className="scroll-mt-8 px-4 sm:px-6 py-16 sm:py-20 -mt-6 relative z-10">
        <div className="mx-auto max-w-6xl grid gap-5 lg:grid-cols-3">
          {ENTIDADES.map((e) => (
            <Link
              key={e.id}
              href={e.href}
              className="group relative overflow-hidden rounded-sm border border-white/10 bg-[#121a2e]/90 backdrop-blur-sm p-6 sm:p-7 hover:border-white/30 transition-all hover:-translate-y-0.5"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(ellipse at top right, ${e.cor}33 0%, transparent 60%)`,
                }}
              />
              <div className="relative">
                {e.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.logo}
                    alt=""
                    className="h-20 w-20 rounded-full object-cover mb-5 border border-white/20 shadow-lg"
                  />
                ) : (
                  <div
                    className="h-12 w-12 rounded-full mb-5 flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: e.cor }}
                  >
                    {e.nomeCurto.slice(0, 1)}
                  </div>
                )}
                <p
                  className="text-[11px] tracking-[0.18em] uppercase mb-2"
                  style={{ color: e.corSuave }}
                >
                  {e.nomeCurto}
                </p>
                <h2
                  className="text-xl sm:text-2xl leading-snug text-[#f3e9d0] mb-3"
                  style={{ fontFamily: "var(--font-site-display), serif" }}
                >
                  {e.nome}
                </h2>
                <p className="text-sm text-[#f3e9d0]/60 leading-relaxed mb-5 line-clamp-3">
                  {e.descricao}
                </p>
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: e.corSuave }}
                >
                  Entrar
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5 px-4 sm:px-6 py-14">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2
              className="text-2xl text-[#f3e9d0]"
              style={{ fontFamily: "var(--font-site-display), serif" }}
            >
              Você é membro da Loja?
            </h2>
            <p className="mt-2 text-sm text-[#f3e9d0]/60 max-w-md">
              Os trabalhos internos não aparecem no site público. Entre com CPF + senha
              para ver a biblioteca conforme o seu grau.
            </p>
          </div>
          <SiteIrmaoLink className="inline-flex items-center gap-2 rounded-sm bg-[#0ea5e9] text-[#0b1220] px-5 py-2.5 text-sm font-semibold hover:bg-[#38bdf8] transition-colors shrink-0" />
        </div>
      </section>
    </div>
  );
}
