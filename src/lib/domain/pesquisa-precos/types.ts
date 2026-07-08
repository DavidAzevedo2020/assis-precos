export type Fonte =
  | "painel_precos_api"
  | "pncp_api"
  | "midia_especializada"
  | "pesquisa_direta"
  | "nota_fiscal";

export type MetodoCalculo = "media" | "mediana" | "menor_valor";

export interface Cotacao {
  id: string;
  fonte: Fonte;
  valorUnitario: number;
  dataCotacao: string;
  /** Fornecedor/CNPJ/origem — usado para validar mínimo de 3 fornecedores na fonte "pesquisa_direta" */
  fornecedorOuOrigem?: string;
  excluida: boolean;
  motivoExclusao?: string;
}

export interface ItemPesquisa {
  id: string;
  descricao: string;
  unidadeMedida: string;
}
