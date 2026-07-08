"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getProcessoDoUsuario } from "@/lib/data/processos";
import { db } from "@/lib/db";
import { itens } from "@/lib/db/schema";
import { itemSchema } from "@/lib/validation/schemas/item";

export interface ItemFormState {
  errors?: Record<string, string[] | undefined>;
  message?: string;
}

export async function criarItem(
  processoId: string,
  _prevState: ItemFormState | undefined,
  formData: FormData,
): Promise<ItemFormState> {
  await getProcessoDoUsuario(processoId);

  const validado = itemSchema.safeParse({
    descricao: formData.get("descricao"),
    unidadeMedida: formData.get("unidadeMedida"),
    quantidade: formData.get("quantidade"),
    catmatCatserCodigo: formData.get("catmatCatserCodigo") || undefined,
  });

  if (!validado.success) {
    return { errors: z.flattenError(validado.error).fieldErrors };
  }

  const [item] = await db
    .insert(itens)
    .values({
      processoId,
      descricao: validado.data.descricao,
      unidadeMedida: validado.data.unidadeMedida,
      quantidade: String(validado.data.quantidade),
      catmatCatserCodigo: validado.data.catmatCatserCodigo,
    })
    .returning({ id: itens.id });

  revalidatePath(`/processos/${processoId}`);
  redirect(`/processos/${processoId}/itens/${item.id}`);
}

export async function excluirItem(processoId: string, itemId: string) {
  await getProcessoDoUsuario(processoId);
  await db.delete(itens).where(eq(itens.id, itemId));
  revalidatePath(`/processos/${processoId}`);
  redirect(`/processos/${processoId}`);
}
