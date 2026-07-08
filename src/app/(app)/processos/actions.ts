"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { verifySession } from "@/lib/dal";
import { db } from "@/lib/db";
import { processos } from "@/lib/db/schema";
import { processoSchema } from "@/lib/validation/schemas/processo";

export interface ProcessoFormState {
  errors?: Record<string, string[] | undefined>;
  message?: string;
}

export async function criarProcesso(
  _prevState: ProcessoFormState | undefined,
  formData: FormData,
): Promise<ProcessoFormState> {
  const session = await verifySession();

  const validado = processoSchema.safeParse({
    numeroProcesso: formData.get("numeroProcesso"),
    objeto: formData.get("objeto"),
  });

  if (!validado.success) {
    return { errors: z.flattenError(validado.error).fieldErrors };
  }

  const [processo] = await db
    .insert(processos)
    .values({ ...validado.data, responsavelId: session.userId })
    .returning({ id: processos.id });

  revalidatePath("/dashboard");
  redirect(`/processos/${processo.id}`);
}

export async function atualizarStatusProcesso(
  processoId: string,
  status: (typeof processos.$inferSelect)["status"],
): Promise<void> {
  const session = await verifySession();

  await db
    .update(processos)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(processos.id, processoId),
        eq(processos.responsavelId, session.userId),
      ),
    );

  revalidatePath(`/processos/${processoId}`);
}
