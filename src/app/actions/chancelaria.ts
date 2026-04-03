"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { LOJA_ID_TEMP } from "@/lib/constants";
import type { TipoSessao, StatusSessao } from "@/generated/prisma/enums";

// ─── Sessões ────────────────────────────────────────────────

export async function getSessoesChancelaria() {
  return prisma.sessao.findMany({
    where: { lojaId: LOJA_ID_TEMP },
    orderBy: { data: "desc" },
    include: {
      _count: { select: { presencas: true } },
      presencas: {
        where: { presente: true },
        select: { id: true },
      },
    },
  });
}

export async function getSessaoParaChamada(sessaoId: string) {
  return prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: {
      presencas: {
        include: {
          irmao: {
            select: { id: true, nome: true, cim: true, grau: true, cargo: true },
          },
        },
        orderBy: { irmao: { nome: "asc" } },
      },
    },
  });
}

interface CriarSessaoInput {
  data: string;
  tipo: TipoSessao;
  tema?: string;
  descricao?: string;
}

export async function criarSessao(input: CriarSessaoInput) {
  const sessao = await prisma.sessao.create({
    data: {
      data: new Date(input.data),
      tipo: input.tipo,
      status: "RASCUNHO",
      tema: input.tema?.trim() || null,
      descricao: input.descricao?.trim() || null,
      lojaId: LOJA_ID_TEMP,
    },
  });
  revalidatePath("/presenca");
  revalidatePath("/sessoes");
  return sessao;
}

export async function abrirSessao(sessaoId: string) {
  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } });
  if (!sessao || sessao.status === "CONCLUIDA") {
    throw new Error("Sessão não pode ser aberta.");
  }

  await prisma.sessao.update({
    where: { id: sessaoId },
    data: { status: "ABERTA" },
  });

  revalidatePath("/presenca");
  revalidatePath(`/presenca/${sessaoId}`);
}

// ─── Presença ───────────────────────────────────────────────

export async function inicializarPresenca(sessaoId: string) {
  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } });
  if (!sessao) throw new Error("Sessão não encontrada.");
  if (sessao.status === "CONCLUIDA") throw new Error("Sessão já concluída.");

  if (sessao.status === "RASCUNHO") {
    await prisma.sessao.update({
      where: { id: sessaoId },
      data: { status: "ABERTA" },
    });
  }

  const irmaosAtivos = await prisma.irmao.findMany({
    where: { lojaId: LOJA_ID_TEMP, status: "ATIVO" },
    select: { id: true },
  });

  const jaExistem = await prisma.presenca.findMany({
    where: { sessaoId },
    select: { irmaoId: true },
  });
  const existenteSet = new Set(jaExistem.map((p) => p.irmaoId));

  const novos = irmaosAtivos
    .filter((i) => !existenteSet.has(i.id))
    .map((i) => ({ sessaoId, irmaoId: i.id, presente: false }));

  if (novos.length > 0) {
    await prisma.presenca.createMany({ data: novos });
  }

  revalidatePath(`/presenca/${sessaoId}`);
}

export async function togglePresencaIrmao(presencaId: string, presente: boolean) {
  const presenca = await prisma.presenca.findUnique({
    where: { id: presencaId },
    include: { sessao: { select: { status: true } } },
  });

  if (!presenca) throw new Error("Registro não encontrado.");
  if (presenca.sessao.status === "CONCLUIDA") {
    throw new Error("Não é possível editar presença de sessão concluída.");
  }

  await prisma.presenca.update({
    where: { id: presencaId },
    data: {
      presente,
      justificativa: presente ? null : presenca.justificativa,
    },
  });

  revalidatePath(`/presenca/${presenca.sessaoId}`);
}

export async function salvarJustificativa(presencaId: string, justificativa: string) {
  const presenca = await prisma.presenca.findUnique({
    where: { id: presencaId },
    include: { sessao: { select: { status: true } } },
  });

  if (!presenca) throw new Error("Registro não encontrado.");
  if (presenca.sessao.status === "CONCLUIDA") {
    throw new Error("Não é possível editar presença de sessão concluída.");
  }

  await prisma.presenca.update({
    where: { id: presencaId },
    data: { justificativa: justificativa.trim() || null },
  });

  revalidatePath(`/presenca/${presenca.sessaoId}`);
}

export async function marcarTodosPresentes(sessaoId: string) {
  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } });
  if (!sessao) throw new Error("Sessão não encontrada.");
  if (sessao.status === "CONCLUIDA") {
    throw new Error("Não é possível editar presença de sessão concluída.");
  }

  await prisma.presenca.updateMany({
    where: { sessaoId },
    data: { presente: true },
  });

  revalidatePath(`/presenca/${sessaoId}`);
}

export async function desmarcarTodosPresentes(sessaoId: string) {
  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } });
  if (!sessao) throw new Error("Sessão não encontrada.");
  if (sessao.status === "CONCLUIDA") {
    throw new Error("Não é possível editar presença de sessão concluída.");
  }

  await prisma.presenca.updateMany({
    where: { sessaoId },
    data: { presente: false },
  });

  revalidatePath(`/presenca/${sessaoId}`);
}

export async function concluirSessao(sessaoId: string) {
  const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId } });
  if (!sessao) throw new Error("Sessão não encontrada.");
  if (sessao.status === "CONCLUIDA") {
    throw new Error("Sessão já está concluída.");
  }

  await prisma.sessao.update({
    where: { id: sessaoId },
    data: { status: "CONCLUIDA" },
  });

  revalidatePath("/presenca");
  revalidatePath(`/presenca/${sessaoId}`);
  revalidatePath("/sessoes");
}

export async function reabrirSessao(sessaoId: string) {
  await prisma.sessao.update({
    where: { id: sessaoId },
    data: { status: "ABERTA" },
  });

  revalidatePath("/presenca");
  revalidatePath(`/presenca/${sessaoId}`);
}
