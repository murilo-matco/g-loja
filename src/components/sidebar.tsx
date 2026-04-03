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

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navigation = allNavigation.filter((item) => temPermissao(item.href));

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar transition-all duration-300 h-full",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
              G
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate leading-tight">
                G-Loja
              </h1>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">
                Gestão Maçônica
              </p>
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
          className={cn("ml-auto h-8 w-8 shrink-0", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <Separator />

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

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
                  render={<Link href={item.href} className={linkClass} />}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link key={item.name} href={item.href} className={linkClass}>
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.name}</span>}
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
                  render={<Link href={item.href} className={linkClass} />}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Link key={item.name} href={item.href} className={linkClass}>
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
