import type { Cotacao, ItemPesquisa } from "./types";

export interface LinhaMapaComparativo {
  cotacaoId: string;
  fonte: Cotacao["fonte"];
  valorUnitario: number;
  dataCotacao: string;
  fornecedorOuOrigem?: string;
  situacao: "considerada" | "excluida";
  motivoExclusao?: string;
}

export interface MapaComparativo {
  item: ItemPesquisa;
  linhas: LinhaMapaComparativo[];
  totalCotacoes: number;
  totalConsideradas: number;
  totalExcluidas: number;
}

export function gerarMapaComparativo(
  item: ItemPesquisa,
  cotacoes: Cotacao[],
): MapaComparativo {
  const linhas: LinhaMapaComparativo[] = cotacoes
    .slice()
    .sort((a, b) => a.valorUnitario - b.valorUnitario)
    .map((c) => ({
      cotacaoId: c.id,
      fonte: c.fonte,
      valorUnitario: c.valorUnitario,
      dataCotacao: c.dataCotacao,
      fornecedorOuOrigem: c.fornecedorOuOrigem,
      situacao: c.excluida ? "excluida" : "considerada",
      motivoExclusao: c.motivoExclusao,
    }));

  const totalExcluidas = linhas.filter(
    (l) => l.situacao === "excluida",
  ).length;

  return {
    item,
    linhas,
    totalCotacoes: linhas.length,
    totalConsideradas: linhas.length - totalExcluidas,
    totalExcluidas,
  };
}
