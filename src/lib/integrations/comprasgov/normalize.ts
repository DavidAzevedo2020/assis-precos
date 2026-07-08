import type { CotacaoEncontrada } from "../shared/types";
import type { ItemPesquisaPrecoComprasGov } from "./types";

export function normalizarItemComprasGov(
  item: ItemPesquisaPrecoComprasGov,
): CotacaoEncontrada {
  return {
    fonte: "painel_precos_api",
    valorUnitario: item.precoUnitario,
    dataCotacao: item.dataCompra.slice(0, 10),
    fornecedorOuOrigem: item.nomeFornecedor,
    fonteDetalhe: item,
  };
}
