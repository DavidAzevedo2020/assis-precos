import * as z from "zod";

export const itemSchema = z.object({
  descricao: z.string().trim().min(3, { error: "Descreva o item pesquisado." }),
  unidadeMedida: z.string().trim().min(1, { error: "Informe a unidade de medida." }),
  quantidade: z.coerce
    .number({ error: "Informe uma quantidade válida." })
    .positive({ error: "A quantidade deve ser maior que zero." }),
  catmatCatserCodigo: z.string().trim().optional(),
});

export type ItemInput = z.infer<typeof itemSchema>;
