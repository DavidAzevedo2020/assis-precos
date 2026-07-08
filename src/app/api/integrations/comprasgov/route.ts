import { NextResponse } from "next/server";
import {
  buscarPrecoMaterial,
  buscarPrecoServico,
} from "@/lib/integrations/comprasgov/client";
import { normalizarItemComprasGov } from "@/lib/integrations/comprasgov/normalize";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const tipo = searchParams.get("tipo");
  const codigoItemCatalogo = searchParams.get("codigoItemCatalogo");

  if ((tipo !== "material" && tipo !== "servico") || !codigoItemCatalogo) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          tipo: "parse",
          mensagem:
            'Parâmetros obrigatórios: tipo ("material" ou "servico") e codigoItemCatalogo (CATMAT/CATSER).',
        },
      },
      { status: 400 },
    );
  }

  const params = {
    codigoItemCatalogo: Number(codigoItemCatalogo),
    estado: searchParams.get("estado") ?? undefined,
    codigoMunicipio: searchParams.get("codigoMunicipio")
      ? Number(searchParams.get("codigoMunicipio"))
      : undefined,
    dataCompraInicio: searchParams.get("dataCompraInicio") ?? undefined,
    dataCompraFim: searchParams.get("dataCompraFim") ?? undefined,
    pagina: Number(searchParams.get("pagina") ?? 1),
  };

  const resultado =
    tipo === "material"
      ? await buscarPrecoMaterial(params)
      : await buscarPrecoServico(params);

  if (!resultado.ok) {
    return NextResponse.json({ ok: false, error: resultado.error }, {
      status: 502,
    });
  }

  return NextResponse.json({
    ok: true,
    cotacoes: resultado.data.resultado.map(normalizarItemComprasGov),
    totalRegistros: resultado.data.totalRegistros,
    totalPaginas: resultado.data.totalPaginas,
  });
}
