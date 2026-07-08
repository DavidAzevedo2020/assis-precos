import "server-only";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { documentos, itens, processos } from "@/lib/db/schema";
import { verifySession } from "@/lib/dal";

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
