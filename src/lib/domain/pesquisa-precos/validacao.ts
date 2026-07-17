import type { Cotacao } from "./types";

/** Formata no padrão monetário brasileiro — ex: 6793.84 -> "6.793,84". */
function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface ResultadoValidacao {
  valido: boolean;
  mensagens: string[];
}

export const MINIMO_COTACOES_GERAL = 3;
export const MINIMO_FORNECEDORES_PESQUISA_DIRETA = 3;

/**
 * Art. 6º da IN 65/2021: exige conjunto de 3 ou mais preços para aplicar o
 * método estatístico. Quando a única fonte usada é "pesquisa_direta" (Art. 5º,
 * inciso IV), exige-se também um mínimo de 3 fornecedores distintos.
 */
export function validarMinimoFontes(
  todasCotacoes: Cotacao[],
): ResultadoValidacao {
  const ativas = todasCotacoes.filter((c) => !c.excluida);
  const mensagens: string[] = [];

  if (ativas.length < MINIMO_COTACOES_GERAL) {
    mensagens.push(
      `São necessárias no mínimo ${MINIMO_COTACOES_GERAL} cotações válidas para aplicar o método estatístico (encontradas: ${ativas.length}).`,
    );
  }

  const fontesUsadas = new Set(ativas.map((c) => c.fonte));
  const usaSomentePesquisaDireta =
    fontesUsadas.size === 1 && fontesUsadas.has("pesquisa_direta");

  if (usaSomentePesquisaDireta) {
    const fornecedoresDistintos = new Set(
      ativas
        .filter((c) => c.fonte === "pesquisa_direta")
        .map((c) => c.fornecedorOuOrigem)
        .filter((f): f is string => Boolean(f)),
    );

    if (fornecedoresDistintos.size < MINIMO_FORNECEDORES_PESQUISA_DIRETA) {
      mensagens.push(
        `Quando a única fonte é a pesquisa direta com fornecedores, são exigidos no mínimo ${MINIMO_FORNECEDORES_PESQUISA_DIRETA} fornecedores distintos (encontrados: ${fornecedoresDistintos.size}).`,
      );
    }
  }

  return { valido: mensagens.length === 0, mensagens };
}

/** Toda cotação marcada como excluída precisa de justificativa registrada (Art. 6º). */
export function validarJustificativasExclusao(
  todasCotacoes: Cotacao[],
): ResultadoValidacao {
  const semJustificativa = todasCotacoes.filter(
    (c) => c.excluida && !c.motivoExclusao?.trim(),
  );

  if (semJustificativa.length === 0) {
    return { valido: true, mensagens: [] };
  }

  return {
    valido: false,
    mensagens: semJustificativa.map(
      (c) =>
        `A cotação de R$ ${formatarMoeda(c.valorUnitario)} (fonte: ${c.fonte}) foi marcada como excluída, mas não possui motivo registrado.`,
    ),
  };
}
