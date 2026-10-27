"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getLojaAtual, atualizarLoja, formatCNPJ, type Loja } from "@/lib/auth-store";
import { Building2, Save, Loader2, CheckCircle } from "lucide-react";

export default function ConfiguracoesPage() {
  const [loja, setLoja] = useState<Loja | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [oriente, setOriente] = useState("");
  const [nomeAdmin, setNomeAdmin] = useState("");

  useEffect(() => {
    getLojaAtual().then((l) => {
      if (l) {
        setLoja(l);
        setNome(l.nome);
        setCnpj(l.cnpj);
        setOriente(l.oriente);
        setNomeAdmin(l.nome_admin);
      }
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!loja) return;
    setErro("");
    setSuccess(false);
    setSaving(true);

    const result = await atualizarLoja(loja.id, {
      nome: nome.trim(),
      cnpj: cnpj.trim(),
      oriente: oriente.trim(),
      nome_admin: nomeAdmin.trim(),
    });

    setSaving(false);

    if (!result.ok) {
      setErro(result.erro ?? "Erro ao salvar.");
      return;
    }

    setSuccess(true);
    const updated = await getLojaAtual();
    if (updated) {
      setLoja(updated);
      setCnpj(updated.cnpj);
    }
    setTimeout(() => setSuccess(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!loja) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loja não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Configurações da Loja
        </h1>
        <p className="text-muted-foreground mt-1">
          Edite os dados cadastrais da sua loja.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Loja</CardTitle>
          <CardDescription>
            Estas informações aparecem no cabeçalho do sistema e nos relatórios.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Loja *</Label>
              <Input
                id="nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Loja Estrela do Oriente nº 001"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  required
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  placeholder="00.000.000/0001-00"
                />
                <p className="text-[11px] text-muted-foreground">
                  Usado para login do Venerável Mestre
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="oriente">Oriente</Label>
                <Input
                  id="oriente"
                  value={oriente}
                  onChange={(e) => setOriente(e.target.value)}
                  placeholder="Ex: Oriente de São Paulo — GOB"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeAdmin">Nome do Administrador</Label>
              <Input
                id="nomeAdmin"
                value={nomeAdmin}
                onChange={(e) => setNomeAdmin(e.target.value)}
                placeholder="Ex: Ven.·. Mestre"
              />
            </div>

            <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ID da Loja</span>
                <Badge variant="outline" className="font-mono text-[10px]">{loja.id}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Criada em</span>
                <span className="text-xs">{new Date(loja.criado_em).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>

            {erro && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-600">
                {erro}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Dados salvos com sucesso!
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t bg-muted/30 flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Alterações
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
