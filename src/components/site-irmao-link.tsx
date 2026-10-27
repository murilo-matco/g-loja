"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSession, homePathForCargo, isLoggedIn } from "@/lib/auth-store";

type Props = {
  className?: string;
  /** Texto quando ainda não há sessão */
  labelGuest?: string;
  /** Texto quando já logado */
  labelAuth?: string;
};

/**
 * No site público: "Área do Irmão" → login.
 * Se já estiver logado: vai direto aos trabalhos (ou home do cargo).
 */
export function SiteIrmaoLink({
  className,
  labelGuest = "Área do Irmão",
  labelAuth = "Meus trabalhos",
}: Props) {
  const [href, setHref] = useState("/login");
  const [label, setLabel] = useState(labelGuest);

  useEffect(() => {
    if (!isLoggedIn()) {
      setHref("/login");
      setLabel(labelGuest);
      return;
    }
    const s = getSession();
    setHref(s ? homePathForCargo(s.cargo) : "/app/trabalhos");
    setLabel(labelAuth);
  }, [labelGuest, labelAuth]);

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
