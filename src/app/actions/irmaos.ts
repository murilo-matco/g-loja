"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { LOJA_ID_TEMP } from "@/lib/constants";
import type { Grau, CargoLoja, StatusIrmao } from "@/generated/prisma/enums";

export async function getIrmaos(search?: string, status?: string) {
  const where: Record<string, unknown> = { lojaId: LOJA_ID_TEMP };

  if (search) {
    where.OR = [
      { nome: { contains: search, mode: "insensitive" } },
      { cim: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status && status !== "TODOS") {
    where.status = status;
  }

  return prisma.irmao.findMany({
    where,
    orderBy: { nome: "asc" },
  });
}

export async function getIrmao(id: string) {
  return prisma.irmao.findUnique({ where: { id } });
}

export async function getIrmaosAtivos() {
  return prisma.irmao.findMany({
    where: { lojaId: LOJA_ID_TEMP, status: "ATIVO" },
    orderBy: { nome: "asc" },
  });
}

interface CreateIrmaoData {
  nome: string;
  cim: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  grau: Grau;
  cargo: CargoLoja;
  status: StatusIrmao;
  dataNasc?: string;
  dataIniciacao?: string;
}

export async function createIrmao(data: CreateIrmaoData) {
  const irmao = await prisma.irmao.create({
    data: {
      nome: data.nome,
      cim: data.cim,
      cpf: data.cpf || null,
      email: data.email || null,
      telefone: data.telefone || null,
      grau: data.grau,
      cargo: data.cargo,
      status: data.status,
      dataNasc: data.dataNasc ? new Date(data.dataNasc) : null,
      dataIniciacao: data.dataIniciacao ? new Date(data.dataIniciacao) : null,
      lojaId: LOJA_ID_TEMP,
    },
  });

  revalidatePath("/irmaos");
  return irmao;
}

export async function updateIrmao(id: string, data: CreateIrmaoData) {
  const irmao = await prisma.irmao.update({
    where: { id },
    data: {
      nome: data.nome,
      cim: data.cim,
      cpf: data.cpf || null,
      email: data.email || null,
      telefone: data.telefone || null,
      grau: data.grau,
      cargo: data.cargo,
      status: data.status,
      dataNasc: data.dataNasc ? new Date(data.dataNasc) : null,
      dataIniciacao: data.dataIniciacao ? new Date(data.dataIniciacao) : null,
    },
  });

  revalidatePath("/irmaos");
  return irmao;
}

export async function deleteIrmao(id: string) {
  await prisma.irmao.delete({ where: { id } });
  revalidatePath("/irmaos");
}
