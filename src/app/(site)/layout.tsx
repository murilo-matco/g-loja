import type { Metadata } from "next";
import { Cormorant_Garamond, Libre_Franklin } from "next/font/google";
import Link from "next/link";

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
  title: "G-Loja | Loja Maçônica",
  description: "Site institucional da Loja — ações, fotos e memória dos trabalhos.",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${display.variable} ${body.variable} min-h-full flex flex-col`}
      style={{ fontFamily: "var(--font-site-body), system-ui, sans-serif" }}
    >
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 py-5">
          <Link
            href="/"
            className="text-xl sm:text-2xl tracking-wide text-[#f3e9d0]"
            style={{ fontFamily: "var(--font-site-display), serif" }}
          >
            G-Loja
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6 text-sm text-[#f3e9d0]/90">
            <a href="#acoes" className="hover:text-white transition-colors hidden sm:inline">
              Ações
            </a>
            <a href="#sobre" className="hover:text-white transition-colors hidden sm:inline">
              Sobre
            </a>
            <Link
              href="/login"
              className="rounded-sm border border-[#c4a35a]/50 bg-[#c4a35a]/15 px-3 py-1.5 text-[#f3e9d0] hover:bg-[#c4a35a]/25 transition-colors"
            >
              Área do Irmão
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-[#0a0f1a] text-[#f3e9d0]/60 text-sm py-8 px-4 border-t border-white/5">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <p style={{ fontFamily: "var(--font-site-display), serif" }} className="text-[#c4a35a]">
            G-Loja
          </p>
          <p className="text-xs text-center sm:text-right">
            Conteúdo público da Loja · Gestão reservada aos membros
          </p>
        </div>
      </footer>
    </div>
  );
}
