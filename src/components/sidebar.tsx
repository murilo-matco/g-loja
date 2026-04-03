"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardCheck,
  Wallet,
  FileBarChart,
  Settings,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { temPermissao } from "@/lib/auth-store";
import { useSidebar } from "@/components/sidebar-context";

const allNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Irmãos", href: "/irmaos", icon: Users },
  { name: "Sessões", href: "/sessoes", icon: CalendarDays },
  { name: "Presença", href: "/presenca", icon: ClipboardCheck },
  { name: "Financeiro", href: "/financeiro", icon: Wallet },
  { name: "Relatórios", href: "/relatorios", icon: FileBarChart },
];

const bottomNav = [
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onNavClick,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const navigation = allNavigation.filter((item) => temPermissao(item.href));

  return (
    <>
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
              G
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate leading-tight">G-Loja</h1>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">Gestão Maçônica</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm mx-auto">
            G
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto h-8 w-8 shrink-0 hidden md:flex", collapsed && "mx-auto")}
          onClick={onToggleCollapse}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <Separator />

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          const linkClass = cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-2"
          );

          if (collapsed) {
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger
                  delay={0}
                  render={<Link href={item.href} className={linkClass} onClick={onNavClick} />}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link key={item.name} href={item.href} className={linkClass} onClick={onNavClick}>
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="py-3 px-2 space-y-1">
        {bottomNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const linkClass = cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-2"
          );

          if (collapsed) {
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger
                  delay={0}
                  render={<Link href={item.href} className={linkClass} onClick={onNavClick} />}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link key={item.name} href={item.href} className={linkClass} onClick={onNavClick}>
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { mobileOpen, setMobileOpen } = useSidebar();

  // Close mobile sidebar on route change
  const pathname = usePathname();
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-300 h-full",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-sidebar border-r border-border transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute top-3 right-3 z-10">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <SidebarContent
          collapsed={false}
          onToggleCollapse={() => {}}
          onNavClick={() => setMobileOpen(false)}
        />
      </aside>
    </>
  );
}
