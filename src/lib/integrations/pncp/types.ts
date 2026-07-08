/**
 * Tabela de domínio "Modalidade de Contratação" do Manual de Integração PNCP.
 * https://www.gov.br/pncp/pt-br/central-de-conteudo/manuais/manual-de-integracao-pncp
 */
export const MODALIDADES_CONTRATACAO = {
  1: "Leilão - Eletrônico",
  2: "Diálogo Competitivo",
  3: "Concurso",
  4: "Concorrência - Eletrônica",
  5: "Concorrência - Presencial",
  6: "Pregão - Eletrônico",
  7: "Pregão - Presencial",
  8: "Dispensa de Licitação",
  9: "Inexigibilidade",
  10: "Manifestação de Interesse",
  11: "Pré-qualificação",
  12: "Credenciamento",
  13: "Leilão - Presencial",
  14: "Inaplicabilidade da Licitação",
} as const;

export type CodigoModalidadeContratacao = keyof typeof MODALIDADES_CONTRATACAO;

export interface OrgaoEntidadePNCP {
  cnpj: string;
  razaoSocial: string;
}

export interface UnidadeOrgaoPNCP {
  ufSigla?: string;
  ufNome?: string;
  municipioNome?: string;
  codigoIbge?: string;
  nomeUnidade?: string;
}

/** Subconjunto dos campos de RecuperarCompraPublicacaoDTO que usamos. */
export interface ContratacaoPublicacaoPNCP {
  numeroControlePNCP: string;
  numeroCompra: string;
  objetoCompra: string;
  valorTotalEstimado?: number;
  valorTotalHomologado?: number;
  dataPublicacaoPncp: string;
  dataAberturaProposta?: string;
  dataEncerramentoProposta?: string;
  orgaoEntidade?: OrgaoEntidadePNCP;
  unidadeOrgao?: UnidadeOrgaoPNCP;
  modalidadeNome?: string;
}

export interface RespostaPaginadaPNCP<T> {
  data: T[];
  totalRegistros: number;
  totalPaginas: number;
  numeroPagina: number;
  paginasRestantes: number;
  empty: boolean;
}

export interface BuscarContratacoesParams {
  /** Formato AAAA-MM-DD; convertido internamente para AAAAMMDD exigido pela API. */
  dataInicial: string;
  dataFinal: string;
  codigoModalidadeContratacao: CodigoModalidadeContratacao;
  uf?: string;
  codigoMunicipioIbge?: string;
  cnpj?: string;
  pagina?: number;
  tamanhoPagina?: number;
}
