"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARGO_LABELS, GRAU_LABELS, STATUS_LABELS } from "@/lib/constants";
import { getIrmao, atualizarIrmao } from "@/lib/irmaos-store";
import type { Irmao } from "@/types/irmao";
import { XCircle } from "lucide-react";

const GRAU_KEYS = Object.keys(GRAU_LABELS) as (keyof typeof GRAU_LABELS)[];
const CARGO_KEYS = Object.keys(CARGO_LABELS) as (keyof typeof CARGO_LABELS)[];
const STATUS_KEYS = Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[];

type FormFields = {
  nome: string;
  cim: string;
  cpf: string;
  email: string;
  telefone: string;
  grau: string;
  cargo: string;
  status: string;
  dataNasc: string;
  dataIniciacao: string;
};

function irmaoToForm(irmao: Irmao): FormFields {
  return {
    nome: irmao.nome,
    cim: irmao.cim,
    cpf: irmao.cpf ?? "",
    email: irmao.email ?? "",
    telefone: irmao.telefone ?? "",
    grau: irmao.grau,
    cargo: irmao.cargo,
    status: irmao.status,
    dataNasc: irmao.dataNasc ?? "",
    dataIniciacao: irmao.dataIniciacao ?? "",
  };
}

export default function EditarIrmaoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const routeId = params.id;

  const [irmao, setIrmao] = useState<Irmao | null>(null);
  const [loadingIrmao, setLoadingIrmao] = useState(true);

  const [form, setForm] = useState<FormFields>({
    nome: "",
    cim: "",
    cpf: "",
    email: "",
    telefone: "",
    grau: "APRENDIZ",
    cargo: "MEMBRO",
    status: "ATIVO",
    dataNasc: "",
    dataIniciacao: "",
  });

  useEffect(() => {
    getIrmao(routeId).then((i) => {
      setIrmao(i ?? null);
      setLoadingIrmao(false);
    });
  }, [routeId]);

  useEffect(() => {
    if (irmao) setForm(irmaoToForm(irmao));
  }, [irmao]);

  const tituloNome = irmao?.nome ?? "Irmão não encontrado";

  const update =
    (field: keyof FormFields) =>
    (value: string | null) => {
      if (value == null) return;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await atualizarIrmao(routeId, {
      nome: form.nome.trim(),
      cim: form.cim.trim(),
      cpf: form.cpf.trim() || null,
      email: form.email.trim() || null,
      telefone: form.telefone.trim() || null,
      grau: form.grau,
      cargo: form.cargo,
      status: form.status,
      dataNasc: form.dataNasc || null,
      dataIniciacao: form.dataIniciacao || null,
    });
    router.push("/app/irmaos");
  };

  if (loadingIrmao) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!irmao) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="max-w-sm w-full">
          <CardContent className="py-12 text-center space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Irmão não encontrado.</p>
            <Link href="/app/irmaos">
              <Button variant="outline">Voltar para lista</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground">Dashboard</span>
          {" / "}
          <span className="text-foreground">Irmãos</span>
          {" / "}
          <span className="font-medium text-foreground">Editar</span>
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Editar Irmão
        </h1>
        <p className="text-muted-foreground">
          {tituloNome}
          <span className="block text-xs">
            CIM {irmao.cim}
          </span>
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Editar Irmão</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  required
                  value={form.nome}
                  onChange={(e) => update("nome")(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cim">CIM *</Label>
                <Input
                  id="cim"
                  required
                  value={form.cim}
                  onChange={(e) => update("cim")(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={form.cpf}
                  onChange={(e) => update("cpf")(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email")(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => update("telefone")(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grau">Grau</Label>
                <Select
                  value={form.grau}
                  onValueChange={(v) => {
                    if (v != null) update("grau")(v);
                  }}
                >
                  <SelectTrigger id="grau" className="w-full">
                    <SelectValue placeholder="Grau" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAU_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {GRAU_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select
                  value={form.cargo}
                  onValueChange={(v) => {
                    if (v != null) update("cargo")(v);
                  }}
                >
                  <SelectTrigger id="cargo" className="w-full">
                    <SelectValue placeholder="Cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARGO_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {CARGO_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => {
                    if (v != null) update("status")(v);
                  }}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {STATUS_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNasc">Data de Nascimento</Label>
                <Input
                  id="dataNasc"
                  type="date"
                  value={form.dataNasc}
                  onChange={(e) => update("dataNasc")(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataIniciacao">Data de Iniciação</Label>
                <Input
                  id="dataIniciacao"
                  type="date"
                  value={form.dataIniciacao}
                  onChange={(e) => update("dataIniciacao")(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t bg-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/app/irmaos")}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar alterações</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
