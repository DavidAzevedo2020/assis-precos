import "server-only";
import { fetchResiliente } from "../shared/http";
import type { IntegrationResult } from "../shared/types";
import type {
  BuscarPrecoComprasGovParams,
  RespostaPesquisaPrecoComprasGov,
} from "./types";

const BASE_URL = "https://dadosabertos.compras.gov.br/modulo-pesquisa-preco";

/** A API rejeita tamanhoPagina fora do intervalo 10–500 com HTTP 400. */
function clampTamanhoPagina(tamanho: number | undefined): number {
  return Math.min(500, Math.max(10, tamanho ?? 20));
}

function montarQuery(params: BuscarPrecoComprasGovParams): URLSearchParams {
  const query = new URLSearchParams({
    codigoItemCatalogo: String(params.codigoItemCatalogo),
    pagina: String(params.pagina ?? 1),
    tamanhoPagina: String(clampTamanhoPagina(params.tamanhoPagina)),
  });

  if (params.estado) query.set("estado", params.estado);
  if (params.codigoMunicipio)
    query.set("codigoMunicipio", String(params.codigoMunicipio));
  if (params.dataCompraInicio)
    query.set("dataCompraInicio", params.dataCompraInicio);
  if (params.dataCompraFim) query.set("dataCompraFim", params.dataCompraFim);

  return query;
}

/**
 * Consulta preços praticados de materiais (código CATMAT), via módulo de
 * dados abertos que substituiu o Painel de Preços legado (parado desde
 * julho/2025) — fonte I do Art. 5º da IN 65/2021.
 */
export async function buscarPrecoMaterial(
  params: BuscarPrecoComprasGovParams,
): Promise<IntegrationResult<RespostaPesquisaPrecoComprasGov>> {
  const query = montarQuery(params);
  return fetchResiliente<RespostaPesquisaPrecoComprasGov>(
    `${BASE_URL}/1_consultarMaterial?${query.toString()}`,
  );
}

/** Mesma finalidade de `buscarPrecoMaterial`, para itens de serviço (código CATSER). */
export async function buscarPrecoServico(
  params: BuscarPrecoComprasGovParams,
): Promise<IntegrationResult<RespostaPesquisaPrecoComprasGov>> {
  const query = montarQuery(params);
  return fetchResiliente<RespostaPesquisaPrecoComprasGov>(
    `${BASE_URL}/3_consultarServico?${query.toString()}`,
  );
}
