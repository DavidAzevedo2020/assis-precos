import { calcularMedia, calcularDesvioPadrao } from "./estatistica";
import type { Cotacao } from "./types";

export type MetodoDeteccao = "iqr" | "desvio_padrao";

export interface CandidataExclusao {
  cotacao: Cotacao;
  motivoSugerido: string;
}

export interface ResultadoDeteccaoOutliers {
  validas: Cotacao[];
  candidatas: CandidataExclusao[];
}

function quartil(valoresOrdenados: number[], q: number): number {
  const pos = (valoresOrdenados.length - 1) * q;
  const base = Math.floor(pos);
  const resto = pos - base;
  if (valoresOrdenados[base + 1] !== undefined) {
    return (
      valoresOrdenados[base] +
      resto * (valoresOrdenados[base + 1] - valoresOrdenados[base])
    );
  }
  return valoresOrdenados[base];
}

/**
 * Apenas SINALIZA candidatos a exclusão — nunca exclui automaticamente.
 * O Art. 6º da IN 65/2021 exige que a exclusão de valores inexequíveis ou
 * excessivamente elevados seja feita com "critérios fundamentados", ou seja,
 * uma decisão humana registrada, não uma decisão puramente algorítmica.
 */
export function detectarOutliers(
  cotacoesConsideraveis: Cotacao[],
  metodo: MetodoDeteccao = "iqr",
): ResultadoDeteccaoOutliers {
  const ativas = cotacoesConsideraveis.filter((c) => !c.excluida);

  if (ativas.length < 4) {
    return { validas: ativas, candidatas: [] };
  }

  const valores = ativas.map((c) => c.valorUnitario);
  const candidatas: CandidataExclusao[] = [];
  const validas: Cotacao[] = [];

  let limiteInferior: number;
  let limiteSuperior: number;

  if (metodo === "iqr") {
    const ordenados = [...valores].sort((a, b) => a - b);
    const q1 = quartil(ordenados, 0.25);
    const q3 = quartil(ordenados, 0.75);
    const iqr = q3 - q1;
    limiteInferior = q1 - 1.5 * iqr;
    limiteSuperior = q3 + 1.5 * iqr;
  } else {
    const media = calcularMedia(valores);
    const desvio = calcularDesvioPadrao(valores);
    limiteInferior = media - 2 * desvio;
    limiteSuperior = media + 2 * desvio;
  }

  for (const cotacao of ativas) {
    if (cotacao.valorUnitario < limiteInferior) {
      candidatas.push({
        cotacao,
        motivoSugerido: `Valor R$ ${cotacao.valorUnitario.toFixed(2)} está abaixo do limite inferior estimado (R$ ${limiteInferior.toFixed(2)}) — possível preço inexequível.`,
      });
    } else if (cotacao.valorUnitario > limiteSuperior) {
      candidatas.push({
        cotacao,
        motivoSugerido: `Valor R$ ${cotacao.valorUnitario.toFixed(2)} está acima do limite superior estimado (R$ ${limiteSuperior.toFixed(2)}) — possível preço excessivamente elevado.`,
      });
    } else {
      validas.push(cotacao);
    }
  }

  return { validas, candidatas };
}
