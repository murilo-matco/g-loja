"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isLoggedIn, temPermissao } from "@/lib/auth-store";
import { cleanupOldData } from "@/lib/cleanup";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }

    cleanupOldData();

    if (!temPermissao(pathname)) {
      setState("denied");
    } else {
      setState("ok");
    }
  }, [router, pathname]);

  if (state === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para acessar esta página.
            Contate o Venerável Mestre para solicitar acesso.
          </p>
          <Button variant="outline" onClick={() => router.replace("/")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
