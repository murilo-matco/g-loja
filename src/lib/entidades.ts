export type EntidadeId = "loja" | "associacao" | "frafem";

export interface Entidade {
  id: EntidadeId;
  nome: string;
  nomeCurto: string;
  descricao: string;
  href: string;
  /** Cor principal da entidade */
  cor: string;
  corSuave: string;
  logo?: string;
}

/** Portal Fraternidade Adonhiram — aprovado em Loja (proposta portal eletrônico). */
export const ENTIDADES: Entidade[] = [
  {
    id: "loja",
    nome: "ARLS Fraternidade Adonhiram",
    nomeCurto: "Loja",
    descricao:
      "A Loja Maçônica: sessões, trabalhos, ações e a vida do Oriente de Praia Grande.",
    href: "/loja",
    cor: "#1e3a5f",
    corSuave: "#c4a35a",
  },
  {
    id: "associacao",
    nome: "Associação Beneficente Estrada de Damasco",
    nomeCurto: "Associação",
    descricao:
      "Braço beneficente — por uma sociedade mais justa. Ações sociais, eventos e documentação pública.",
    href: "/associacao",
    cor: "#0ea5e9",
    corSuave: "#38bdf8",
    logo: "/brand/associacao-estrada-de-damasco.png",
  },
  {
    id: "frafem",
    nome: "FRAFEM — Fraternidade Feminina Cruzeiro do Sul",
    nomeCurto: "FRAFEM",
    descricao:
      "Fraternidade Feminina de Praia Grande: atividades, encontros e publicações próprias.",
    href: "/frafem",
    cor: "#9d174d",
    corSuave: "#f9a8d4",
  },
];

export function getEntidade(id: EntidadeId): Entidade {
  return ENTIDADES.find((e) => e.id === id)!;
}

export const PORTAL = {
  nome: "Fraternidade Adonhiram",
  oriente: "Praia Grande — SP",
  dominioProposto: "fraternidadeadonhiram.com.br",
};
