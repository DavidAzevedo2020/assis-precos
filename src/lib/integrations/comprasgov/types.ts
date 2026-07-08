export interface ItemPesquisaPrecoComprasGov {
  idCompra: string;
  dataCompra: string;
  modalidade?: string;
  codigoItemCatalogo: number;
  quantidade?: number;
  precoUnitario: number;
  descricaoItem: string;
  siglaUnidadeMedida?: string;
  nomeUnidadeMedida?: string;
  nomeFornecedor?: string;
  niFornecedor?: string;
  nomeOrgao?: string;
  estado?: string;
  municipio?: string;
}

export interface RespostaPesquisaPrecoComprasGov {
  resultado: ItemPesquisaPrecoComprasGov[];
  totalRegistros: number;
  totalPaginas: number;
  paginasRestantes: number;
}

export interface BuscarPrecoComprasGovParams {
  /** Código CATMAT (materiais) ou CATSER (serviços) do item no catálogo. */
  codigoItemCatalogo: number;
  estado?: string;
  codigoMunicipio?: number;
  dataCompraInicio?: string;
  dataCompraFim?: string;
  pagina?: number;
  tamanhoPagina?: number;
}
