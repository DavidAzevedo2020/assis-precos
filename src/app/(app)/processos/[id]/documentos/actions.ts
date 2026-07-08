"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getProcessoDoUsuario } from "@/lib/data/processos";
import { db } from "@/lib/db";
import { documentos } from "@/lib/db/schema";
import type { TipoDocumento } from "@/lib/ai/document-schemas";

export async function obterUltimoDocumento(
  processoId: string,
  tipo: TipoDocumento,
): Promise<string | null> {
  await getProcessoDoUsuario(processoId);

  const [ultimo] = await db
    .select({ id: documentos.id })
    .from(documentos)
    .where(and(eq(documentos.processoId, processoId), eq(documentos.tipo, tipo)))
    .orderBy(desc(documentos.versao))
    .limit(1);

  return ultimo?.id ?? null;
}

export async function atualizarStatusDocumento(
  processoId: string,
  documentoId: string,
  status: (typeof documentos.$inferSelect)["status"],
): Promise<void> {
  await getProcessoDoUsuario(processoId);

  await db
    .update(documentos)
    .set({ status, updatedAt: new Date() })
    .where(eq(documentos.id, documentoId));

  revalidatePath(`/processos/${processoId}/documentos/${documentoId}`);
}
