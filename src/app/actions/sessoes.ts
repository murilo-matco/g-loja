"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { LOJA_ID_TEMP } from "@/lib/constants";
import type { TipoSessao } from "@/generated/prisma/enums";

export async function getSessoes() {
  return prisma.sessao.findMany({
    where: { lojaId: LOJA_ID_TEMP },
    orderBy: { data: "desc" },
    include: {
      _count: {
        select: { presencas: { where: { presente: true } } },
      },
    },
  });
}

export async function getSessao(id: string) {
  return prisma.sessao.findUnique({
    where: { id },
    include: {
      presencas: {
        include: { irmao: true },
        orderBy: { irmao: { nome: "asc" } },
      },
    },
  });
}

export async function getProximaSessao() {
  return prisma.sessao.findFirst({
    where: {
      lojaId: LOJA_ID_TEMP,
      data: { gte: new Date() },
    },
    orderBy: { data: "asc" },
  });
}

interface CreateSessaoData {
  data: string;
  tipo: TipoSessao;
  descricao?: string;
  pauta?: string;
}

export async function createSessao(data: CreateSessaoData) {
  const sessao = await prisma.sessao.create({
    data: {
      data: new Date(data.data),
      tipo: data.tipo,
      descricao: data.descricao || null,
      pauta: data.pauta || null,
      lojaId: LOJA_ID_TEMP,
    },
  });

  revalidatePath("/sessoes");
  revalidatePath("/presenca");
  return sessao;
}

export async function deleteSessao(id: string) {
  await prisma.sessao.delete({ where: { id } });
  revalidatePath("/sessoes");
  revalidatePath("/presenca");
}
