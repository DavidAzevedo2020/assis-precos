import type { MetodoCalculo } from "./types";

export class ConjuntoVazioError extends Error {
  constructor() {
    super("Não é possível calcular sobre um conjunto vazio de valores.");
    this.name = "ConjuntoVazioError";
  }
}

function assertNaoVazio(valores: number[]): void {
  if (valores.length === 0) {
    throw new ConjuntoVazioError();
  }
}

export function calcularMedia(valores: number[]): number {
  assertNaoVazio(valores);
  const soma = valores.reduce((acc, v) => acc + v, 0);
  return soma / valores.length;
}

export function calcularMediana(valores: number[]): number {
  assertNaoVazio(valores);
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);

  if (ordenados.length % 2 === 0) {
    return (ordenados[meio - 1] + ordenados[meio]) / 2;
  }
  return ordenados[meio];
}

export function calcularMenorValor(valores: number[]): number {
  assertNaoVazio(valores);
  return Math.min(...valores);
}

export function calcularMaiorValor(valores: number[]): number {
  assertNaoVazio(valores);
  return Math.max(...valores);
}

export function calcularDesvioPadrao(valores: number[]): number {
  assertNaoVazio(valores);
  if (valores.length === 1) return 0;

  const media = calcularMedia(valores);
  const somaQuadrados = valores.reduce(
    (acc, v) => acc + (v - media) ** 2,
    0,
  );
  return Math.sqrt(somaQuadrados / (valores.length - 1));
}

/** Coeficiente de variação (%) — usado pelo Art. 6º da IN 65/2021 para justificar
 *  o uso da mediana em vez da média quando há dispersão elevada entre os preços. */
export function calcularCoeficienteVariacao(valores: number[]): number {
  const media = calcularMedia(valores);
  if (media === 0) return 0;
  return (calcularDesvioPadrao(valores) / media) * 100;
}

export function calcularPorMetodo(
  valores: number[],
  metodo: MetodoCalculo,
): number {
  switch (metodo) {
    case "media":
      return calcularMedia(valores);
    case "mediana":
      return calcularMediana(valores);
    case "menor_valor":
      return calcularMenorValor(valores);
  }
}

/** Limiar comumente adotado na prática administrativa: CV > 25% indica dispersão
 *  elevada, recomendando o uso da mediana em vez da média (Art. 6º, §1º da IN 65/2021). */
export const LIMIAR_COEFICIENTE_VARIACAO_ELEVADO = 25;

export function recomendarMetodo(valores: number[]): MetodoCalculo {
  if (valores.length < 3) return "menor_valor";
  const cv = calcularCoeficienteVariacao(valores);
  return cv > LIMIAR_COEFICIENTE_VARIACAO_ELEVADO ? "mediana" : "media";
}
