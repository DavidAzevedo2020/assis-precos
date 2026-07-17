import { NextResponse } from "next/server";
import {
  buscarAtaOuContratoPorPalavraChave,
  buscarContratacoesPorPeriodo,
  buscarDetalheContratacao,
  buscarItemContratacao,
  buscarPorPalavraChave,
} from "@/lib/integrations/pncp/client";
import { normalizarContratacaoPNCP } from "@/lib/integrations/pncp/normalize";
import type {
  CodigoModalidadeContratacao,
  TipoDocumentoAtaOuContrato,
} from "@/lib/integrations/pncp/types";
import type { IntegrationResult } from "@/lib/integrations/shared/types";

function foiOk<T>(
  resultado: IntegrationResult<T>,
): resultado is Extract<IntegrationResult<T>, { ok: true }> {
  return resultado.ok;
}

const TAMANHO_PAGINA_BUSCA = 10;

async function buscarPorPalavraChaveComValor(q: string, pagina: number) {
  const resultadoBusca = await buscarPorPalavraChave({
    q,
    pagina,
    tamanhoPagina: TAMANHO_PAGINA_BUSCA,
  });

  if (!resultadoBusca.ok) {
    return NextResponse.json(
      { ok: false, error: resultadoBusca.error },
      { status: 502 },
    );
  }

  // Busca o valor (detalhe da contratação) e o código de catálogo do item
  // nº 1 (CATMAT/CATSER, quando o órgão o informou) em paralelo para cada
  // resultado. Só fazemos isso aqui (não na busca por período/modalidade)
  // porque essa já é limitada a poucos resultados por página.
  const detalhesEItens = await Promise.all(
    resultadoBusca.data.items.map((item) =>
      Promise.all([
        buscarDetalheContratacao({
          cnpj: item.orgaoCnpj,
          ano: item.ano,
          sequencial: item.numeroSequencial,
        }),
        buscarItemContratacao({
          cnpj: item.orgaoCnpj,
          ano: item.ano,
          sequencial: item.numeroSequencial,
        }),
      ]),
    ),
  );

  // Itens cujo detalhe falhar (rede/HTTP) são descartados — a busca por
  // palavra-chave é complementar, então degradar para uma lista parcial é
  // preferível a derrubar a busca inteira. O detalhe do item catálogo é
  // opcional — se falhar, a cotação ainda é exibida, só sem o código.
  const cotacoes = [];
  for (const [detalhe, itemDetalhe] of detalhesEItens) {
    if (!foiOk(detalhe)) continue;

    const cotacao = normalizarContratacaoPNCP(detalhe.data);
    const catalogo = foiOk(itemDetalhe) ? itemDetalhe.data.catalogo : null;
    const catalogoCodigoItem = foiOk(itemDetalhe)
      ? itemDetalhe.data.catalogoCodigoItem
      : null;

    cotacoes.push({
      ...cotacao,
      fonteDetalhe: {
        ...(cotacao.fonteDetalhe as Record<string, unknown>),
        itemCatalogo: catalogo
          ? {
              fonte: catalogo.nome,
              /** id=1 é o Catálogo do Compras.gov.br (CATMAT/CATSER); id=2 ("Outros") não tem correspondência garantida. */
              oficial: catalogo.id === 1,
              codigo: catalogoCodigoItem,
            }
          : null,
      },
    });
  }

  // Se a busca achou itens mas nenhum deles conseguiu confirmar o valor,
  // o problema é instabilidade do PNCP (ex: sobrecarga momentânea), não
  // ausência de resultados — a UI precisa distinguir os dois casos.
  if (resultadoBusca.data.items.length > 0 && cotacoes.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          tipo: "http",
          mensagem:
            "O PNCP encontrou contratações, mas não foi possível confirmar os valores agora (instabilidade momentânea). Tente novamente em instantes.",
        },
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    cotacoes,
    totalRegistros: resultadoBusca.data.totalItems,
    totalPaginas: Math.ceil(resultadoBusca.data.totalItems / TAMANHO_PAGINA_BUSCA),
  });
}

const TIPOS_DOCUMENTO_ATA_OU_CONTRATO = ["ata", "contrato"];

function ehTipoDocumentoAtaOuContrato(
  valor: string,
): valor is TipoDocumentoAtaOuContrato {
  return TIPOS_DOCUMENTO_ATA_OU_CONTRATO.includes(valor);
}

async function buscarAtaOuContrato(
  q: string,
  tipoDocumento: TipoDocumentoAtaOuContrato,
  pagina: number,
) {
  const resultado = await buscarAtaOuContratoPorPalavraChave({
    q,
    tipoDocumento,
    pagina,
    tamanhoPagina: TAMANHO_PAGINA_BUSCA,
  });

  if (!resultado.ok) {
    return NextResponse.json(
      { ok: false, error: resultado.error },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    documentos: resultado.data.items,
    totalRegistros: resultado.data.totalItems,
    totalPaginas: Math.ceil(resultado.data.totalItems / TAMANHO_PAGINA_BUSCA),
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q");
  const tipoDocumento = searchParams.get("tipoDocumento");
  if (q && tipoDocumento && ehTipoDocumentoAtaOuContrato(tipoDocumento)) {
    return buscarAtaOuContrato(q, tipoDocumento, Number(searchParams.get("pagina") ?? 1));
  }
  if (q) {
    return buscarPorPalavraChaveComValor(q, Number(searchParams.get("pagina") ?? 1));
  }

  const dataInicial = searchParams.get("dataInicial");
  const dataFinal = searchParams.get("dataFinal");
  const codigoModalidadeContratacao = searchParams.get(
    "codigoModalidadeContratacao",
  );

  if (!dataInicial || !dataFinal || !codigoModalidadeContratacao) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          tipo: "parse",
          mensagem:
            "Parâmetros obrigatórios: dataInicial, dataFinal e codigoModalidadeContratacao.",
        },
      },
      { status: 400 },
    );
  }

  const resultado = await buscarContratacoesPorPeriodo({
    dataInicial,
    dataFinal,
    codigoModalidadeContratacao: Number(
      codigoModalidadeContratacao,
    ) as CodigoModalidadeContratacao,
    uf: searchParams.get("uf") ?? undefined,
    codigoMunicipioIbge: searchParams.get("codigoMunicipioIbge") ?? undefined,
    cnpj: searchParams.get("cnpj") ?? undefined,
    pagina: Number(searchParams.get("pagina") ?? 1),
  });

  if (!resultado.ok) {
    return NextResponse.json({ ok: false, error: resultado.error }, {
      status: 502,
    });
  }

  return NextResponse.json({
    ok: true,
    cotacoes: resultado.data.data.map(normalizarContratacaoPNCP),
    totalRegistros: resultado.data.totalRegistros,
    totalPaginas: resultado.data.totalPaginas,
  });
}
