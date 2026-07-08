import { describe, expect, it } from "vitest";
import { gerarMapaComparativo } from "./mapa-comparativo";
import type { Cotacao, ItemPesquisa } from "./types";

const item: ItemPesquisa = {
  id: "item-1",
  descricao: "Papel A4 75g/m²",
  unidadeMedida: "resma",
};

function cotacao(overrides: Partial<Cotacao>): Cotacao {
  return {
    id: crypto.randomUUID(),
    fonte: "pncp_api",
    valorUnitario: 100,
    dataCotacao: "2026-01-01",
    excluida: false,
    ...overrides,
  };
}

describe("gerarMapaComparativo", () => {
  it("ordena as linhas por valor crescente e computa totais", () => {
    const mapa = gerarMapaComparativo(item, [
      cotacao({ valorUnitario: 30 }),
      cotacao({ valorUnitario: 10, excluida: true, motivoExclusao: "abaixo do mercado" }),
      cotacao({ valorUnitario: 20 }),
    ]);

    expect(mapa.linhas.map((l) => l.valorUnitario)).toEqual([10, 20, 30]);
    expect(mapa.totalCotacoes).toBe(3);
    expect(mapa.totalExcluidas).toBe(1);
    expect(mapa.totalConsideradas).toBe(2);
    expect(mapa.linhas[0].situacao).toBe("excluida");
  });
});
