import { NextResponse } from "next/server";
import { buscarContratacoesPorPeriodo } from "@/lib/integrations/pncp/client";
import { normalizarContratacaoPNCP } from "@/lib/integrations/pncp/normalize";
import type { CodigoModalidadeContratacao } from "@/lib/integrations/pncp/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

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
