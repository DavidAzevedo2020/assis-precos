import "server-only";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { calculos, documentos, itens, processos } from "@/lib/db/schema";
import { verifySession } from "@/lib/dal";
import { formatarMoeda, formatarQuantidade } from "@/lib/utils";

/** Busca um processo garantindo que pertence ao usuário autenticado. */
export async function getProcessoDoUsuario(processoId: string) {
  const session = await verifySession();

  const [processo] = await db
    .select()
    .from(processos)
    .where(
      and(
        eq(processos.id, processoId),
        eq(processos.responsavelId, session.userId),
      ),
    );

  if (!processo) notFound();

  return processo;
}

/** Busca um item garantindo que o processo ao qual pertence é do usuário autenticado. */
export async function getItemDoUsuario(itemId: string) {
  const session = await verifySession();

  const [resultado] = await db
    .select({ item: itens, processo: processos })
    .from(itens)
    .innerJoin(processos, eq(itens.processoId, processos.id))
    .where(
      and(eq(itens.id, itemId), eq(processos.responsavelId, session.userId)),
    );

  if (!resultado) notFound();

  return resultado;
}

/**
 * Agrega os itens e o resultado da pesquisa de preços de um processo, para
 * pré-preencher os campos objetivos (quantidade/valor) dos formulários de
 * DFD, ETP e Nota Técnica. Campos narrativos (objeto/justificativa etc.)
 * ficam de fora — precisam de redação humana, não são deriváveis dos dados.
 */
export async function obterResumoPesquisaDoProcesso(processoId: string) {
  const session = await verifySession();

  const [processo] = await db
    .select()
    .from(processos)
    .where(
      and(eq(processos.id, processoId), eq(processos.responsavelId, session.userId)),
    );

  if (!processo) notFound();

  const itensDoProcesso = await db.query.itens.findMany({
    where: eq(itens.processoId, processoId),
    with: {
      calculos: { orderBy: (calculos, { desc }) => [desc(calculos.createdAt)], limit: 1 },
    },
  });

  const linhas = itensDoProcesso.map((item) => {
    const ultimoCalculo = item.calculos[0];
    const valorUnitario = ultimoCalculo ? Number(ultimoCalculo.valorResultado) : null;
    const quantidade = Number(item.quantidade);
    return {
      descricao: item.descricao,
      quantidadeTexto: `${formatarQuantidade(quantidade)} ${item.unidadeMedida}`,
      valorTotal: valorUnitario !== null ? valorUnitario * quantidade : null,
    };
  });

  const itensComValor = linhas.filter((l) => l.valorTotal !== null);
  const valorEstimadoTotal = itensComValor.reduce((soma, l) => soma + (l.valorTotal ?? 0), 0);

  return {
    objeto: processo.objeto,
    numeroProcesso: processo.numeroProcesso,
    quantidadeEstimadaTexto: linhas
      .map((l) => `${l.quantidadeTexto} (${l.descricao})`)
      .join("; "),
    valorEstimadoTexto:
      itensComValor.length > 0 ? `R$ ${formatarMoeda(valorEstimadoTotal)}` : "",
    itensSemPreco: linhas.filter((l) => l.valorTotal === null).map((l) => l.descricao),
  };
}

export type ResumoPesquisaProcesso = Awaited<
  ReturnType<typeof obterResumoPesquisaDoProcesso>
>;

/** Busca um documento garantindo que o processo ao qual pertence é do usuário autenticado. */
export async function getDocumentoDoUsuario(documentoId: string) {
  const session = await verifySession();

  const [resultado] = await db
    .select({ documento: documentos, processo: processos })
    .from(documentos)
    .innerJoin(processos, eq(documentos.processoId, processos.id))
    .where(
      and(
        eq(documentos.id, documentoId),
        eq(processos.responsavelId, session.userId),
      ),
    );

  if (!resultado) notFound();

  return resultado;
}
