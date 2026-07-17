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

/**
 * Item retornado pelo endpoint de busca por palavra-chave (`/api/search`) —
 * o mesmo que alimenta a caixa de busca do site pncp.gov.br. Não faz parte
 * da API de Consulta documentada no Manual de Integração PNCP e não traz
 * valor estimado/homologado; use `orgaoCnpj` + `ano` + `numeroSequencial`
 * para buscar o detalhe completo via `buscarDetalheContratacao`.
 */
export interface ItemBuscaPNCP {
  numeroControlePNCP: string;
  title: string;
  description: string;
  orgaoCnpj: string;
  orgaoNome: string;
  ano: string;
  numeroSequencial: string;
  municipioNome?: string;
  uf?: string;
  dataPublicacaoPncp: string;
}

export interface RespostaBuscaPNCP {
  items: ItemBuscaPNCP[];
  totalItems: number;
}

export interface BuscarPorPalavraChaveParams {
  q: string;
  pagina?: number;
  tamanhoPagina?: number;
}

/** Tipos de documento pesquisáveis via busca por palavra-chave (endpoint `/api/search`). */
export type TipoDocumentoAtaOuContrato = "ata" | "contrato";

/**
 * Item retornado pela busca por palavra-chave quando `tipos_documento` é
 * "ata" ou "contrato". Diferente de `ItemBuscaPNCP` (editais), já traz órgão,
 * esfera, datas e valor global — não é preciso buscar detalhe separado.
 * Mesma ressalva de `buscarPorPalavraChave`: endpoint não documentado no
 * Manual de Integração PNCP, pode mudar sem aviso.
 */
export interface ItemBuscaAtaOuContratoPNCP {
  numeroControlePNCP: string;
  tipoDocumento: TipoDocumentoAtaOuContrato;
  titulo: string;
  descricao: string;
  orgaoNome: string;
  esferaNome?: string;
  municipioNome?: string;
  uf?: string;
  dataAssinatura?: string;
  dataFimVigencia?: string;
  /** Valor total do contrato/empenho. Atas de registro de preços normalmente não têm valor global (null). */
  valorGlobal: number | null;
  cancelado: boolean;
  url: string;
}

export interface RespostaBuscaAtaOuContratoPNCP {
  items: ItemBuscaAtaOuContratoPNCP[];
  totalItems: number;
}

export interface BuscarAtaOuContratoPorPalavraChaveParams {
  q: string;
  tipoDocumento: TipoDocumentoAtaOuContrato;
  pagina?: number;
  tamanhoPagina?: number;
}

/**
 * Detalhe de um item de contratação. `catalogo` identifica de qual catálogo
 * vem `catalogoCodigoItem` — o PNCP reconhece hoje apenas dois:
 * id=1 "Catálogo do Compras.gov.br" (o mesmo CATMAT/CATSER usado pela API do
 * Compras.gov.br) e id=2 "Outros" (código não-padronizado, sem
 * correspondência garantida). Muitos órgãos não preenchem esse campo.
 */
export interface ItemDetalhePNCP {
  numeroItem: number;
  descricao: string;
  materialOuServico?: "M" | "S";
  materialOuServicoNome?: string;
  catalogo?: { id: number; nome: string } | null;
  catalogoCodigoItem?: string | null;
}
