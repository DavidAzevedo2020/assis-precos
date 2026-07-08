import * as z from "zod";

export const processoSchema = z.object({
  numeroProcesso: z.string().trim().min(1, { error: "Informe o número do processo." }),
  objeto: z.string().trim().min(5, { error: "Descreva o objeto do processo." }),
});

export type ProcessoInput = z.infer<typeof processoSchema>;
