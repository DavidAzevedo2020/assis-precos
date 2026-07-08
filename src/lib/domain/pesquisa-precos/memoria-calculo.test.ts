import { describe, expect, it } from "vitest";
import { gerarMemoriaCalculo } from "./memoria-calculo";
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

describe("gerarMemoriaCalculo", () => {
  it("monta a memória de cálculo com fontes, justificativas e resultado", () => {
    const cotacoes = [
      cotacao({ fonte: "pncp_api", valorUnitario: 100 }),
      cotacao({ fonte: "painel_precos_api", valorUnitario: 110 }),
      cotacao({
        fonte: "midia_especializada",
        valorUnitario: 9999,
        excluida: true,
        motivoExclusao: "preço incompatível com o mercado",
      }),
    ];

    const memoria = gerarMemoriaCalculo(item, cotacoes, "media", 105);

    expect(memoria.totalCotacoesConsideradas).toBe(2);
    expect(memoria.totalCotacoesExcluidas).toBe(1);
    expect(memoria.fontesConsultadas).toHaveLength(3);
    expect(memoria.justificativasExclusao).toHaveLength(1);
    expect(memoria.justificativasExclusao[0]).toContain(
      "preço incompatível com o mercado",
    );
    expect(memoria.textoFormatado).toContain("MEMÓRIA DE CÁLCULO");
    expect(memoria.textoFormatado).toContain("R$ 105.00");
    expect(memoria.textoFormatado).toContain("Art. 6º");
  });
});
