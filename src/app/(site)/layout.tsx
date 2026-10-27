import type { Metadata } from "next";
import { Cormorant_Garamond, Libre_Franklin } from "next/font/google";
import Link from "next/link";
import { PORTAL } from "@/lib/entidades";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-site-display",
});

const body = Libre_Franklin({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-site-body",
});

export const metadata: Metadata = {
  title: `${PORTAL.nome} | Portal Eletrônico`,
  description:
    "Portal institucional — ARLS Fraternidade Adonhiram, Associação Estrada de Damasco e FRAFEM Cruzeiro do Sul · Praia Grande.",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${display.variable} ${body.variable} min-h-full flex flex-col`}
      style={{ fontFamily: "var(--font-site-body), system-ui, sans-serif" }}
    >
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 py-5 gap-3">
          <Link
            href="/"
            className="text-lg sm:text-xl tracking-wide text-[#f3e9d0] truncate"
            style={{ fontFamily: "var(--font-site-display), serif" }}
          >
            {PORTAL.nome}
          </Link>
          <nav className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm text-[#f3e9d0]/90 shrink-0">
            <Link href="/loja" className="hover:text-white transition-colors hidden md:inline">
              Loja
            </Link>
            <Link href="/associacao" className="hover:text-white transition-colors hidden md:inline">
              Associação
            </Link>
            <Link href="/frafem" className="hover:text-white transition-colors hidden md:inline">
              FRAFEM
            </Link>
            <Link
              href="/login"
              className="rounded-sm border border-[#0ea5e9]/50 bg-[#0ea5e9]/15 px-3 py-1.5 text-[#f3e9d0] hover:bg-[#0ea5e9]/25 transition-colors"
            >
              Área do Irmão
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-[#070b14] text-[#f3e9d0]/55 text-sm py-8 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p style={{ fontFamily: "var(--font-site-display), serif" }} className="text-[#0ea5e9]">
              {PORTAL.nome}
            </p>
            <p className="text-[11px] mt-0.5">{PORTAL.oriente}</p>
          </div>
          <p className="text-xs text-center sm:text-right max-w-md">
            Loja · Associação Estrada de Damasco · FRAFEM Cruzeiro do Sul
          </p>
        </div>
      </footer>
    </div>
  );
}
