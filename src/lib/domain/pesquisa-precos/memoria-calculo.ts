import type { Cotacao, ItemPesquisa, MetodoCalculo } from "./types";
import { gerarMapaComparativo } from "./mapa-comparativo";

const NOME_FONTE: Record<Cotacao["fonte"], string> = {
  painel_precos_api:
    "Sistema oficial de preços praticados (Compras.gov.br — Art. 5º, I)",
  pncp_api:
    "Contratações similares de outros entes via PNCP (Art. 5º, II)",
  midia_especializada: "Mídia especializada, sítios eletrônicos (Art. 5º, III)",
  pesquisa_direta: "Pesquisa direta com fornecedores (Art. 5º, IV)",
  nota_fiscal: "Banco de notas fiscais eletrônicas (Art. 5º, V)",
};

const NOME_METODO: Record<MetodoCalculo, string> = {
  media: "média",
  mediana: "mediana",
  menor_valor: "menor valor",
};

export interface MemoriaCalculo {
  item: ItemPesquisa;
  metodo: MetodoCalculo;
  valorResultado: number;
  fontesConsultadas: string[];
  totalCotacoesConsideradas: number;
  totalCotacoesExcluidas: number;
  justificativasExclusao: string[];
  textoFormatado: string;
}

export function gerarMemoriaCalculo(
  item: ItemPesquisa,
  cotacoes: Cotacao[],
  metodo: MetodoCalculo,
  valorResultado: number,
): MemoriaCalculo {
  const mapa = gerarMapaComparativo(item, cotacoes);
  const ativas = cotacoes.filter((c) => !c.excluida);
  const fontesConsultadas = Array.from(
    new Set(cotacoes.map((c) => NOME_FONTE[c.fonte])),
  );
  const justificativasExclusao = cotacoes
    .filter((c) => c.excluida)
    .map(
      (c) =>
        `R$ ${c.valorUnitario.toFixed(2)} (${NOME_FONTE[c.fonte]}): ${c.motivoExclusao ?? "sem motivo registrado"}`,
    );

  const linhasTexto = mapa.linhas
    .map((l) => {
      const status =
        l.situacao === "excluida"
          ? `EXCLUÍDA — ${l.motivoExclusao ?? "sem motivo registrado"}`
          : "considerada";
      return `  - R$ ${l.valorUnitario.toFixed(2)} | ${NOME_FONTE[l.fonte]} | ${l.dataCotacao} | ${status}`;
    })
    .join("\n");

  const textoFormatado = [
    `MEMÓRIA DE CÁLCULO — Pesquisa de Preços`,
    `Item: ${item.descricao} (${item.unidadeMedida})`,
    ``,
    `Fontes consultadas:`,
    ...fontesConsultadas.map((f) => `  - ${f}`),
    ``,
    `Série de preços coletados:`,
    linhasTexto,
    ``,
    `Cotações consideradas: ${ativas.length} de ${cotacoes.length}`,
    `Método estatístico aplicado: ${NOME_METODO[metodo]} (Art. 6º da IN SEGES/ME nº 65/2021)`,
    `Valor de referência resultante: R$ ${valorResultado.toFixed(2)}`,
    ...(justificativasExclusao.length > 0
      ? [``, `Justificativas de exclusão:`, ...justificativasExclusao.map((j) => `  - ${j}`)]
      : []),
  ].join("\n");

  return {
    item,
    metodo,
    valorResultado,
    fontesConsultadas,
    totalCotacoesConsideradas: mapa.totalConsideradas,
    totalCotacoesExcluidas: mapa.totalExcluidas,
    justificativasExclusao,
    textoFormatado,
  };
}
