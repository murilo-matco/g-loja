"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
import { criarIrmao } from "@/lib/irmaos-store";

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

const initialForm: FormFields = {
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
};

export default function NovoIrmaoPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormFields>(initialForm);

  const update =
    (field: keyof FormFields) =>
    (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await criarIrmao({
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
    router.push("/irmaos");
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground">Dashboard</span>
          {" / "}
          <span className="text-foreground">Irmãos</span>
          {" / "}
          <span className="font-medium text-foreground">Novo</span>
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Cadastrar Irmão
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Cadastrar Novo Irmão</CardTitle>
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
                  placeholder="ex.: 12.345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={form.cpf}
                  onChange={(e) => update("cpf")(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email")(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => update("telefone")(e.target.value)}
                  autoComplete="tel"
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
              onClick={() => router.push("/irmaos")}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
