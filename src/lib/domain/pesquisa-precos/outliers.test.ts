import { describe, expect, it } from "vitest";
import { detectarOutliers } from "./outliers";
import type { Cotacao } from "./types";

function cotacao(overrides: Partial<Cotacao>): Cotacao {
  return {
    id: crypto.randomUUID(),
    fonte: "pesquisa_direta",
    valorUnitario: 100,
    dataCotacao: "2026-01-01",
    excluida: false,
    ...overrides,
  };
}

describe("detectarOutliers", () => {
  it("não sinaliza nada quando há menos de 4 cotações ativas", () => {
    const cotacoes = [
      cotacao({ valorUnitario: 10 }),
      cotacao({ valorUnitario: 1000 }),
      cotacao({ valorUnitario: 15 }),
    ];

    const resultado = detectarOutliers(cotacoes);

    expect(resultado.candidatas).toHaveLength(0);
    expect(resultado.validas).toHaveLength(3);
  });

  it("sinaliza valor muito acima do restante do conjunto (método IQR)", () => {
    const cotacoes = [
      cotacao({ valorUnitario: 100 }),
      cotacao({ valorUnitario: 105 }),
      cotacao({ valorUnitario: 98 }),
      cotacao({ valorUnitario: 102 }),
      cotacao({ valorUnitario: 5000 }),
    ];

    const resultado = detectarOutliers(cotacoes, "iqr");

    expect(resultado.candidatas).toHaveLength(1);
    expect(resultado.candidatas[0].cotacao.valorUnitario).toBe(5000);
    expect(resultado.candidatas[0].motivoSugerido).toContain(
      "excessivamente elevado",
    );
    expect(resultado.validas).toHaveLength(4);
  });

  it("sinaliza valor muito abaixo do restante do conjunto", () => {
    const cotacoes = [
      cotacao({ valorUnitario: 100 }),
      cotacao({ valorUnitario: 105 }),
      cotacao({ valorUnitario: 98 }),
      cotacao({ valorUnitario: 102 }),
      cotacao({ valorUnitario: 1 }),
    ];

    const resultado = detectarOutliers(cotacoes, "iqr");

    expect(resultado.candidatas).toHaveLength(1);
    expect(resultado.candidatas[0].cotacao.valorUnitario).toBe(1);
    expect(resultado.candidatas[0].motivoSugerido).toContain("inexequível");
  });

  it("ignora cotações já excluídas ao calcular os limites", () => {
    const cotacoes = [
      cotacao({ valorUnitario: 100 }),
      cotacao({ valorUnitario: 105 }),
      cotacao({ valorUnitario: 98 }),
      cotacao({ valorUnitario: 102 }),
      cotacao({
        valorUnitario: 9999,
        excluida: true,
        motivoExclusao: "já excluída manualmente",
      }),
    ];

    const resultado = detectarOutliers(cotacoes);

    expect(resultado.validas).toHaveLength(4);
    expect(resultado.candidatas).toHaveLength(0);
  });

  it("não sinaliza nada quando todos os valores são homogêneos", () => {
    const cotacoes = [
      cotacao({ valorUnitario: 100 }),
      cotacao({ valorUnitario: 101 }),
      cotacao({ valorUnitario: 99 }),
      cotacao({ valorUnitario: 100 }),
    ];

    const resultado = detectarOutliers(cotacoes);

    expect(resultado.candidatas).toHaveLength(0);
    expect(resultado.validas).toHaveLength(4);
  });
});
