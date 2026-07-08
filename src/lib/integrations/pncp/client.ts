import "server-only";
import { fetchResiliente } from "../shared/http";
import type { IntegrationResult } from "../shared/types";
import type {
  BuscarContratacoesParams,
  ContratacaoPublicacaoPNCP,
  RespostaPaginadaPNCP,
} from "./types";

const BASE_URL = "https://pncp.gov.br/api/consulta";

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
