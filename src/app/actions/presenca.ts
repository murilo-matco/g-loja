"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { LOJA_ID_TEMP } from "@/lib/constants";

export async function getPresencasBySessao(sessaoId: string) {
  return prisma.sessao.findUnique({
    where: { id: sessaoId },
    include: {
      presencas: {
        include: { irmao: true },
        orderBy: { irmao: { nome: "asc" } },
      },
    },
  });
}

export async function initPresencaSessao(sessaoId: string) {
  const irmaosAtivos = await prisma.irmao.findMany({
    where: { lojaId: LOJA_ID_TEMP, status: "ATIVO" },
  });

  const existentes = await prisma.presenca.findMany({
    where: { sessaoId },
    select: { irmaoId: true },
  });

  const existenteIds = new Set(existentes.map((p) => p.irmaoId));

  const novas = irmaosAtivos
    .filter((i) => !existenteIds.has(i.id))
    .map((i) => ({
      sessaoId,
      irmaoId: i.id,
      presente: false,
    }));

  if (novas.length > 0) {
    await prisma.presenca.createMany({ data: novas });
  }

  revalidatePath(`/presenca/${sessaoId}`);
}

export async function togglePresenca(presencaId: string, presente: boolean) {
  await prisma.presenca.update({
    where: { id: presencaId },
    data: { presente },
  });

  revalidatePath("/presenca");
}

export async function saveJustificativa(
  presencaId: string,
  justificativa: string
) {
  await prisma.presenca.update({
    where: { id: presencaId },
    data: { justificativa },
  });

  revalidatePath("/presenca");
}

export async function getSessoesComPresenca() {
  return prisma.sessao.findMany({
    where: { lojaId: LOJA_ID_TEMP },
    orderBy: { data: "desc" },
    include: {
      _count: {
        select: { presencas: true },
      },
      presencas: {
        where: { presente: true },
        select: { id: true },
      },
    },
  });
}
