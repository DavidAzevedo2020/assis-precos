import type { CotacaoEncontrada } from "../shared/types";
import type { ContratacaoPublicacaoPNCP } from "./types";

/**
 * O PNCP não expõe valor unitário por item nas buscas de contratações — apenas
 * o valor total da contratação (que pode cobrir vários itens). Usamos o valor
 * homologado (ou estimado, se ainda não homologada) como ponto de partida, mas
 * a UI deve deixar claro que esse valor precisa ser confirmado/ajustado pelo
 * usuário antes de virar uma cotação oficial — especialmente quando a
 * contratação teve múltiplos itens.
 */
export function normalizarContratacaoPNCP(
  contratacao: ContratacaoPublicacaoPNCP,
): CotacaoEncontrada {
  const valor =
    contratacao.valorTotalHomologado ?? contratacao.valorTotalEstimado ?? 0;

  return {
    fonte: "pncp_api",
    valorUnitario: valor,
    dataCotacao: contratacao.dataPublicacaoPncp.slice(0, 10),
    fornecedorOuOrigem: contratacao.orgaoEntidade?.razaoSocial,
    fonteDetalhe: contratacao,
  };
}
