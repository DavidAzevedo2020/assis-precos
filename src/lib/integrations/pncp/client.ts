import "server-only";
import { fetchResiliente } from "../shared/http";
import type { IntegrationResult } from "../shared/types";
import type {
  BuscarAtaOuContratoPorPalavraChaveParams,
  BuscarContratacoesParams,
  BuscarPorPalavraChaveParams,
  ContratacaoPublicacaoPNCP,
  ItemBuscaAtaOuContratoPNCP,
  ItemBuscaPNCP,
  ItemDetalhePNCP,
  RespostaBuscaAtaOuContratoPNCP,
  RespostaBuscaPNCP,
  RespostaPaginadaPNCP,
} from "./types";

const BASE_URL = "https://pncp.gov.br/api/consulta";
const BASE_URL_BUSCA = "https://pncp.gov.br/api/search";
const BASE_URL_PNCP_API = "https://pncp.gov.br/api/pncp";

/** Shape bruto (snake_case) retornado pelo endpoint de busca por palavra-chave. */
interface ItemBuscaPNCPBruto {
  numero_controle_pncp: string;
  title: string;
  description: string;
  orgao_cnpj: string;
  orgao_nome: string;
  ano: string;
  numero_sequencial: string;
  municipio_nome?: string;
  uf?: string;
  data_publicacao_pncp: string;
}

interface RespostaBuscaPNCPBruta {
  items: ItemBuscaPNCPBruto[];
  /**
   * Endpoint não-documentado — já observamos o nome desse campo mudar de
   * `total_items` para `total` sem aviso. Aceitamos os dois.
   */
  total_items?: number;
  total?: number;
}

function normalizarItemBuscaBruto(item: ItemBuscaPNCPBruto): ItemBuscaPNCP {
  return {
    numeroControlePNCP: item.numero_controle_pncp,
    title: item.title,
    description: item.description,
    orgaoCnpj: item.orgao_cnpj,
    orgaoNome: item.orgao_nome,
    ano: item.ano,
    numeroSequencial: item.numero_sequencial,
    municipioNome: item.municipio_nome,
    uf: item.uf,
    dataPublicacaoPncp: item.data_publicacao_pncp,
  };
}

function paraAAAAMMDD(dataIso: string): string {
  return dataIso.replaceAll("-", "");
}

/** A API rejeita tamanhoPagina fora do intervalo 10–50 com HTTP 400. */
function clampTamanhoPagina(tamanho: number | undefined): number {
  return Math.min(50, Math.max(10, tamanho ?? 20));
}

/**
 * Busca contratações publicadas no PNCP num período, filtradas por modalidade
 * (obrigatória na API) e opcionalmente por UF, município ou CNPJ do órgão.
 *
 * Limitação importante: a API de consulta do PNCP não oferece busca por
 * palavra-chave nem por código CATMAT/CATSER — apenas por filtros estruturados.
 * O usuário precisa revisar o campo `objetoCompra` de cada resultado para
 * avaliar a relevância (fonte II do Art. 5º da IN 65/2021).
 */
export async function buscarContratacoesPorPeriodo(
  params: BuscarContratacoesParams,
): Promise<IntegrationResult<RespostaPaginadaPNCP<ContratacaoPublicacaoPNCP>>> {
  const query = new URLSearchParams({
    dataInicial: paraAAAAMMDD(params.dataInicial),
    dataFinal: paraAAAAMMDD(params.dataFinal),
    codigoModalidadeContratacao: String(params.codigoModalidadeContratacao),
    pagina: String(params.pagina ?? 1),
    tamanhoPagina: String(clampTamanhoPagina(params.tamanhoPagina)),
  });

  if (params.uf) query.set("uf", params.uf);
  if (params.codigoMunicipioIbge)
    query.set("codigoMunicipioIbge", params.codigoMunicipioIbge);
  if (params.cnpj) query.set("cnpj", params.cnpj);

  return fetchResiliente<RespostaPaginadaPNCP<ContratacaoPublicacaoPNCP>>(
    `${BASE_URL}/v1/contratacoes/publicacao?${query.toString()}`,
  );
}

/**
 * Busca por palavra-chave, usando o mesmo endpoint que alimenta a caixa de
 * busca do site pncp.gov.br. Diferente de `buscarContratacoesPorPeriodo`,
 * permite relevância textual (ex: "seguro automotivo") em vez de exigir
 * apenas filtros estruturados — mas não é parte da API de Consulta
 * documentada no Manual de Integração PNCP e pode mudar sem aviso prévio.
 * Não traz valor estimado/homologado; combine com `buscarDetalheContratacao`.
 */
export async function buscarPorPalavraChave(
  params: BuscarPorPalavraChaveParams,
): Promise<IntegrationResult<RespostaBuscaPNCP>> {
  const query = new URLSearchParams({
    q: params.q,
    tipos_documento: "edital",
    ordenacao: "-data",
    pagina: String(params.pagina ?? 1),
    tam_pagina: String(clampTamanhoPagina(params.tamanhoPagina)),
  });

  const resultado = await fetchResiliente<RespostaBuscaPNCPBruta>(
    `${BASE_URL_BUSCA}/?${query.toString()}`,
  );

  if (!resultado.ok) return resultado;

  return {
    ok: true,
    data: {
      items: resultado.data.items.map(normalizarItemBuscaBruto),
      totalItems: resultado.data.total_items ?? resultado.data.total ?? 0,
    },
  };
}

/** Shape bruto (snake_case) de um item de ata/contrato retornado pela busca por palavra-chave. */
interface ItemBuscaAtaOuContratoPNCPBruto {
  numero_controle_pncp: string;
  document_type: "ata" | "contrato";
  title: string;
  description: string;
  orgao_nome: string;
  esfera_nome?: string;
  municipio_nome?: string;
  uf?: string;
  data_assinatura?: string;
  data_fim_vigencia?: string;
  valor_global: number | null;
  cancelado: boolean;
  item_url: string;
}

interface RespostaBuscaAtaOuContratoPNCPBruta {
  items: ItemBuscaAtaOuContratoPNCPBruto[];
  total_items?: number;
  total?: number;
}

function normalizarItemBuscaAtaOuContratoBruto(
  item: ItemBuscaAtaOuContratoPNCPBruto,
): ItemBuscaAtaOuContratoPNCP {
  return {
    numeroControlePNCP: item.numero_controle_pncp,
    tipoDocumento: item.document_type,
    titulo: item.title,
    descricao: item.description,
    orgaoNome: item.orgao_nome,
    esferaNome: item.esfera_nome,
    municipioNome: item.municipio_nome,
    uf: item.uf,
    dataAssinatura: item.data_assinatura,
    dataFimVigencia: item.data_fim_vigencia,
    valorGlobal: item.valor_global,
    cancelado: item.cancelado,
    url: `https://pncp.gov.br${item.item_url}`,
  };
}

/**
 * Busca por palavra-chave restrita a atas de registro de preços ou contratos
 * (mesmo endpoint de `buscarPorPalavraChave`, variando `tipos_documento`).
 * Diferente da busca de editais, já traz órgão e valor global no próprio
 * resultado — não é preciso buscar detalhe separado. Atas normalmente não têm
 * valor global (é um registro de preços, não uma contratação com valor único).
 */
export async function buscarAtaOuContratoPorPalavraChave(
  params: BuscarAtaOuContratoPorPalavraChaveParams,
): Promise<IntegrationResult<RespostaBuscaAtaOuContratoPNCP>> {
  const query = new URLSearchParams({
    q: params.q,
    tipos_documento: params.tipoDocumento,
    pagina: String(params.pagina ?? 1),
    tam_pagina: String(clampTamanhoPagina(params.tamanhoPagina)),
  });

  const resultado = await fetchResiliente<RespostaBuscaAtaOuContratoPNCPBruta>(
    `${BASE_URL_BUSCA}/?${query.toString()}`,
  );

  if (!resultado.ok) return resultado;

  return {
    ok: true,
    data: {
      items: resultado.data.items.map(normalizarItemBuscaAtaOuContratoBruto),
      totalItems: resultado.data.total_items ?? resultado.data.total ?? 0,
    },
  };
}

/**
 * Detalhe completo de uma contratação (incl. valor estimado/homologado), a
 * partir do CNPJ do órgão, ano e sequencial — campos retornados por
 * `buscarPorPalavraChave`. Necessário porque o endpoint de busca por
 * palavra-chave não expõe valores.
 */
export async function buscarDetalheContratacao(params: {
  cnpj: string;
  ano: string | number;
  sequencial: string | number;
}): Promise<IntegrationResult<ContratacaoPublicacaoPNCP>> {
  return fetchResiliente<ContratacaoPublicacaoPNCP>(
    `${BASE_URL}/v1/orgaos/${params.cnpj}/compras/${params.ano}/${params.sequencial}`,
  );
}

/**
 * Detalhe do item de uma contratação (por padrão, o item nº 1 — a maioria
 * das contratações pesquisadas aqui, como dispensas, tem um único item).
 * Usado para exibir o código de catálogo (CATMAT/CATSER via "Catálogo do
 * Compras.gov.br"), quando o órgão o informou. Não faz parte da API de
 * Consulta documentada; usa a mesma base não-oficial do site do PNCP.
 */
export async function buscarItemContratacao(params: {
  cnpj: string;
  ano: string | number;
  sequencial: string | number;
  numeroItem?: number;
}): Promise<IntegrationResult<ItemDetalhePNCP>> {
  return fetchResiliente<ItemDetalhePNCP>(
    `${BASE_URL_PNCP_API}/v1/orgaos/${params.cnpj}/compras/${params.ano}/${params.sequencial}/itens/${params.numeroItem ?? 1}`,
  );
}
