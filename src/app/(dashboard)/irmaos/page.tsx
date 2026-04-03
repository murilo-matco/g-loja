import { Suspense } from "react";
import { IrmaosClient } from "./irmaos-client";

function IrmaosTableFallback() {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
      Carregando lista de irmãos…
    </div>
  );
}

export default function IrmaosPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground">Dashboard</span>
          {" / "}
          <span className="font-medium text-foreground">Irmãos</span>
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Irmãos</h1>
        <p className="text-muted-foreground">
          Cadastro e gestão dos membros da loja
        </p>
      </div>

      <Suspense fallback={<IrmaosTableFallback />}>
        <IrmaosClient />
      </Suspense>
    </div>
  );
}
