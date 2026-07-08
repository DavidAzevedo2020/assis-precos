import { describe, expect, it } from "vitest";
import {
  calcularCoeficienteVariacao,
  calcularDesvioPadrao,
  calcularMedia,
  calcularMediana,
  calcularMenorValor,
  calcularPorMetodo,
  ConjuntoVazioError,
  recomendarMetodo,
} from "./estatistica";

describe("calcularMedia", () => {
  it("calcula a média aritmética simples", () => {
    expect(calcularMedia([10, 20, 30])).toBe(20);
  });

  it("lida com um único valor", () => {
    expect(calcularMedia([42])).toBe(42);
  });

  it("lança erro para conjunto vazio", () => {
    expect(() => calcularMedia([])).toThrow(ConjuntoVazioError);
  });
});

describe("calcularMediana", () => {
  it("calcula a mediana com número ímpar de valores", () => {
    expect(calcularMediana([10, 30, 20])).toBe(20);
  });

  it("calcula a mediana com número par de valores (média dos dois centrais)", () => {
    expect(calcularMediana([10, 20, 30, 40])).toBe(25);
  });

  it("não muta o array de entrada", () => {
    const valores = [30, 10, 20];
    calcularMediana(valores);
    expect(valores).toEqual([30, 10, 20]);
  });
});

describe("calcularMenorValor", () => {
  it("retorna o menor valor do conjunto", () => {
    expect(calcularMenorValor([50, 10, 30])).toBe(10);
  });
});

describe("calcularDesvioPadrao", () => {
  it("retorna 0 para um único valor", () => {
    expect(calcularDesvioPadrao([100])).toBe(0);
  });

  it("calcula o desvio padrão amostral", () => {
    // valores: 10, 20, 30 -> média 20, variância amostral = ((10)^2+(0)^2+(10)^2)/2 = 100
    expect(calcularDesvioPadrao([10, 20, 30])).toBeCloseTo(10, 5);
  });
});

describe("calcularCoeficienteVariacao", () => {
  it("retorna 0 quando a média é 0", () => {
    expect(calcularCoeficienteVariacao([0, 0, 0])).toBe(0);
  });

  it("calcula o CV em percentual", () => {
    // desvio 10, média 20 -> CV = 50%
    expect(calcularCoeficienteVariacao([10, 20, 30])).toBeCloseTo(50, 5);
  });
});

describe("calcularPorMetodo", () => {
  it("delega para média, mediana ou menor valor conforme o método", () => {
    const valores = [10, 20, 30];
    expect(calcularPorMetodo(valores, "media")).toBe(20);
    expect(calcularPorMetodo(valores, "mediana")).toBe(20);
    expect(calcularPorMetodo(valores, "menor_valor")).toBe(10);
  });
});

describe("recomendarMetodo", () => {
  it("recomenda menor_valor quando há menos de 3 cotações", () => {
    expect(recomendarMetodo([10, 20])).toBe("menor_valor");
  });

  it("recomenda média quando a dispersão é baixa", () => {
    expect(recomendarMetodo([100, 102, 101])).toBe("media");
  });

  it("recomenda mediana quando a dispersão é elevada (CV > 25%)", () => {
    expect(recomendarMetodo([10, 100, 12])).toBe("mediana");
  });
});
