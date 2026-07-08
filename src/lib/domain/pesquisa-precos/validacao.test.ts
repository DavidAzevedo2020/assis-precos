import { describe, expect, it } from "vitest";
import {
  validarJustificativasExclusao,
  validarMinimoFontes,
} from "./validacao";
import type { Cotacao } from "./types";

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

describe("validarMinimoFontes", () => {
  it("é inválido com menos de 3 cotações ativas", () => {
    const resultado = validarMinimoFontes([
      cotacao({}),
      cotacao({}),
    ]);

    expect(resultado.valido).toBe(false);
    expect(resultado.mensagens[0]).toContain("no mínimo 3");
  });

  it("é válido com 3 ou mais cotações de fontes diferentes", () => {
    const resultado = validarMinimoFontes([
      cotacao({ fonte: "pncp_api" }),
      cotacao({ fonte: "painel_precos_api" }),
      cotacao({ fonte: "midia_especializada" }),
    ]);

    expect(resultado.valido).toBe(true);
    expect(resultado.mensagens).toHaveLength(0);
  });

  it("ignora cotações excluídas na contagem", () => {
    const resultado = validarMinimoFontes([
      cotacao({}),
      cotacao({}),
      cotacao({ excluida: true, motivoExclusao: "outlier" }),
    ]);

    expect(resultado.valido).toBe(false);
  });

  it("exige 3 fornecedores distintos quando só há pesquisa direta", () => {
    const resultado = validarMinimoFontes([
      cotacao({ fonte: "pesquisa_direta", fornecedorOuOrigem: "Fornecedor A" }),
      cotacao({ fonte: "pesquisa_direta", fornecedorOuOrigem: "Fornecedor A" }),
      cotacao({ fonte: "pesquisa_direta", fornecedorOuOrigem: "Fornecedor B" }),
    ]);

    expect(resultado.valido).toBe(false);
    expect(resultado.mensagens.some((m) => m.includes("fornecedores distintos"))).toBe(
      true,
    );
  });

  it("aceita pesquisa direta com 3 fornecedores distintos", () => {
    const resultado = validarMinimoFontes([
      cotacao({ fonte: "pesquisa_direta", fornecedorOuOrigem: "Fornecedor A" }),
      cotacao({ fonte: "pesquisa_direta", fornecedorOuOrigem: "Fornecedor B" }),
      cotacao({ fonte: "pesquisa_direta", fornecedorOuOrigem: "Fornecedor C" }),
    ]);

    expect(resultado.valido).toBe(true);
  });
});

describe("validarJustificativasExclusao", () => {
  it("é inválido quando há cotação excluída sem motivo", () => {
    const resultado = validarJustificativasExclusao([
      cotacao({ excluida: true }),
    ]);

    expect(resultado.valido).toBe(false);
  });

  it("é válido quando toda cotação excluída tem motivo registrado", () => {
    const resultado = validarJustificativasExclusao([
      cotacao({ excluida: true, motivoExclusao: "Valor muito abaixo do mercado" }),
      cotacao({ excluida: false }),
    ]);

    expect(resultado.valido).toBe(true);
  });
});
