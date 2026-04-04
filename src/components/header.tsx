"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Bell,
  CalendarDays,
  Settings,
  User,
  LogOut,
  ClipboardCheck,
  Wallet,
  ChevronRight,
  CheckCheck,
  Menu,
} from "lucide-react";
import { getSessoes } from "@/lib/presenca-store";
import { getTransacoes } from "@/lib/financeiro-store";
import { logout, getSession } from "@/lib/auth-store";
import { useSidebar } from "@/components/sidebar-context";

// ─── Types ──────────────────────────────────────────────────

interface Notificacao {
  id: string;
  iconName: "calendar" | "clipboard" | "wallet" | "check";
  titulo: string;
  descricao: string;
  tempo: string;
  href?: string;
  lida: boolean;
  variant: "info" | "warning" | "success";
}

// ─── Helpers ────────────────────────────────────────────────

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateShort(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
    new Date(y, m - 1, d)
  );
}

function diasAte(iso: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const [y, m, d] = iso.split("-").map(Number);
  const alvo = new Date(y, m - 1, d);
  alvo.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

const ICON_MAP = {
  calendar: CalendarDays,
  clipboard: ClipboardCheck,
  wallet: Wallet,
  check: CheckCheck,
};

const VARIANT_STYLES: Record<string, string> = {
  info: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
};

// ─── Build notifications ────────────────────────────────────

async function buildNotificacoes(): Promise<Notificacao[]> {
  const notifs: Notificacao[] = [];
  const hoje = todayISO();

  try {
    const sessoes = await getSessoes();
    const futuras = sessoes
      .filter((s) => s.data >= hoje)
      .sort((a, b) => a.data.localeCompare(b.data));

    for (const s of futuras.slice(0, 3)) {
      const dias = diasAte(s.data);
      let tempo = "";
      if (dias === 0) tempo = "Hoje";
      else if (dias === 1) tempo = "Amanhã";
      else tempo = `Em ${dias} dias`;

      notifs.push({
        id: `sessao-${s.id}`,
        iconName: "calendar",
        titulo: dias === 0 ? "Sessão hoje!" : `Sessão em ${formatDateShort(s.data)}`,
        descricao: s.tema || s.tipo.charAt(0) + s.tipo.slice(1).toLowerCase(),
        tempo,
        href: "/sessoes",
        lida: dias > 7,
        variant: dias <= 1 ? "warning" : "info",
      });
    }

    const pendentes = sessoes.filter((s) => s.data < hoje && s.status !== "CONCLUIDA");
    if (pendentes.length > 0) {
      notifs.push({
        id: "presenca-pendente",
        iconName: "clipboard",
        titulo: "Presença pendente",
        descricao: `${pendentes.length} sessão(ões) sem chamada concluída`,
        tempo: "Ação necessária",
        href: "/presenca",
        lida: false,
        variant: "warning",
      });
    }
  } catch {
    /* store not ready */
  }

  try {
    const tx = await getTransacoes();
    const vencidos = tx.filter((t) => t.status === "PENDENTE" && t.vencimento <= hoje);
    if (vencidos.length > 0) {
      notifs.push({
        id: "financeiro-pendente",
        iconName: "wallet",
        titulo: "Lançamentos vencidos",
        descricao: `${vencidos.length} transação(ões) pendente(s)`,
        tempo: "Verificar",
        href: "/financeiro",
        lida: false,
        variant: "warning",
      });
    }
  } catch {
    /* store not ready */
  }

  if (notifs.length === 0) {
    notifs.push({
      id: "sem-notif",
      iconName: "check",
      titulo: "Tudo em dia!",
      descricao: "Nenhuma pendência no momento",
      tempo: "Agora",
      lida: true,
      variant: "success",
    });
  }

  return notifs;
}

// ─── Notification Icon ──────────────────────────────────────

function NotifIcon({ name, variant }: { name: Notificacao["iconName"]; variant: string }) {
  const Icon = ICON_MAP[name];
  return (
    <div className={cn("mt-0.5 rounded-md p-1.5 shrink-0", VARIANT_STYLES[variant])}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────

export function Header() {
  const router = useRouter();
  const { toggleMobile } = useSidebar();

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [showConfig, setShowConfig] = useState(false);
  const [showPerfil, setShowPerfil] = useState(false);

  const [nomeLoja, setNomeLoja] = useState("Loja Estrela do Oriente nº 001");
  const [oriente, setOriente] = useState("Oriente de São Paulo — GOB");
  const [nomeUsuario, setNomeUsuario] = useState("Ven.·. Mestre");

  useEffect(() => {
    buildNotificacoes().then(setNotificacoes);

    const session = getSession();
    if (session) {
      setNomeLoja(session.nomeLoja);
      setOriente(session.oriente);
      setNomeUsuario(session.nome);
    }

    const saved = localStorage.getItem("gloja-config");
    if (saved) {
      try {
        const c = JSON.parse(saved);
        if (c.nomeLoja) setNomeLoja(c.nomeLoja);
        if (c.oriente) setOriente(c.oriente);
        if (c.nomeUsuario) setNomeUsuario(c.nomeUsuario);
      } catch {
        /* invalid JSON */
      }
    }
  }, []);

  useEffect(() => {
    if (!bellOpen && !menuOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (bellOpen && bellRef.current && !bellRef.current.contains(target)) {
        setBellOpen(false);
      }
      if (menuOpen && menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [bellOpen, menuOpen]);

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const initials =
    nomeUsuario
      .replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "VM";

  const salvarConfig = useCallback(() => {
    localStorage.setItem("gloja-config", JSON.stringify({ nomeLoja, oriente, nomeUsuario }));
    setShowConfig(false);
  }, [nomeLoja, oriente, nomeUsuario]);

  const salvarPerfil = useCallback(() => {
    localStorage.setItem("gloja-config", JSON.stringify({ nomeLoja, oriente, nomeUsuario }));
    setShowPerfil(false);
  }, [nomeLoja, oriente, nomeUsuario]);

  return (
    <>
      <header className="h-14 md:h-16 border-b border-border bg-background flex items-center justify-between px-3 md:px-6 shrink-0 gap-2">
        {/* Left: hamburger + lodge info */}
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0 h-9 w-9"
            onClick={toggleMobile}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-sm md:text-lg font-semibold truncate">{nomeLoja}</h2>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">{oriente}</p>
          </div>
        </div>

        {/* Right: bell + avatar */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* ── Sininho de Notificações ── */}
          <div ref={bellRef} className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={() => setBellOpen((o) => !o)}
            >
              <Bell className="h-[18px] w-[18px]" />
              {naoLidas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                  {naoLidas > 9 ? "9+" : naoLidas}
                </span>
              )}
            </Button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm z-50 rounded-lg border bg-popover text-popover-foreground shadow-lg">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <span className="text-xs font-medium text-muted-foreground">Notificações</span>
                  {naoLidas > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {naoLidas} nova{naoLidas !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notificacoes.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={cn(
                        "flex items-start gap-3 w-full text-left py-2.5 px-3 hover:bg-accent transition-colors border-b last:border-0",
                        !n.lida && "bg-muted/40"
                      )}
                      onClick={() => {
                        if (n.href) {
                          router.push(n.href);
                          setBellOpen(false);
                        }
                      }}
                    >
                      <NotifIcon name={n.iconName} variant={n.variant} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{n.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.descricao}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.tempo}</span>
                        {n.href && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Menu do Ven.·. Mestre ── */}
          <div ref={menuRef} className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 h-9"
              onClick={() => { setMenuOpen((o) => !o); setBellOpen(false); }}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden lg:inline max-w-[120px] truncate">{nomeUsuario}</span>
            </Button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 z-50 rounded-lg border bg-popover text-popover-foreground shadow-lg overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{nomeUsuario}</p>
                      <p className="text-xs text-muted-foreground truncate">Administrador</p>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    onClick={() => { setMenuOpen(false); setShowPerfil(true); }}
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Meu Perfil
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-accent transition-colors"
                    onClick={() => { setMenuOpen(false); setShowConfig(true); }}
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Configurações da Loja
                  </button>
                </div>

                <div className="border-t py-1">
                  <button
                    type="button"
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => { setMenuOpen(false); logout(); router.replace("/login"); }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Dialog: Configurações da Loja ── */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações da Loja
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cfg-nome">Nome da Loja</Label>
              <Input id="cfg-nome" value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cfg-oriente">Oriente / Obediência</Label>
              <Input id="cfg-oriente" value={oriente} onChange={(e) => setOriente(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfig(false)}>Cancelar</Button>
            <Button onClick={salvarConfig}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Meu Perfil ── */}
      <Dialog open={showPerfil} onOpenChange={setShowPerfil}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meu Perfil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{nomeUsuario}</p>
                <p className="text-sm text-muted-foreground">Administrador</p>
              </div>
            </div>
            <hr className="border-border" />
            <div className="space-y-2">
              <Label htmlFor="perfil-nome">Nome de exibição</Label>
              <Input id="perfil-nome" value={nomeUsuario} onChange={(e) => setNomeUsuario(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPerfil(false)}>Cancelar</Button>
            <Button onClick={salvarPerfil}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
