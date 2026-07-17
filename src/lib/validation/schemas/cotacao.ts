import * as z from "zod";

export const fontesManuaisEnum = z.enum([
  "midia_especializada",
  "pesquisa_direta",
  "nota_fiscal",
]);

export const cotacaoManualSchema = z.object({
  fonte: fontesManuaisEnum,
  valorUnitario: z.coerce
    .number({ error: "Informe um valor válido." })
    .positive({ error: "O valor deve ser maior que zero." }),
  dataCotacao: z.string().trim().min(1, { error: "Informe a data da cotação." }),
  fornecedorOuOrigem: z.string().trim().optional(),
});

export type CotacaoManualInput = z.infer<typeof cotacaoManualSchema>;

export const exclusaoCotacaoSchema = z.object({
  cotacaoId: z.string().uuid(),
  excluida: z.boolean(),
  motivoExclusao: z.string().trim().optional(),
});

export const solicitarCotacaoEmailSchema = z.object({
  destinatarios: z
    .array(z.email({ error: "Endereço de e-mail inválido." }))
    .min(1, { error: "Informe pelo menos um fornecedor." }),
  assunto: z.string().trim().min(1, { error: "Informe o assunto." }),
  mensagem: z.string().trim().min(1, { error: "Informe a mensagem." }),
});

export type SolicitarCotacaoEmailInput = z.infer<
  typeof solicitarCotacaoEmailSchema
>;
