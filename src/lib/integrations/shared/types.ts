import type { Fonte } from "@/lib/domain/pesquisa-precos/types";

/** Uma cotação normalizada, pronta para virar uma linha da tabela `cotacoes`. */
export interface CotacaoEncontrada {
  fonte: Extract<Fonte, "pncp_api" | "painel_precos_api">;
  valorUnitario: number;
  dataCotacao: string;
  fornecedorOuOrigem?: string;
  /** Payload bruto retornado pela API, preservado para auditoria. */
  fonteDetalhe: unknown;
}

export interface IntegrationError {
  tipo: "timeout" | "http" | "rede" | "parse";
  mensagem: string;
  statusCode?: number;
}

export type IntegrationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: IntegrationError };
