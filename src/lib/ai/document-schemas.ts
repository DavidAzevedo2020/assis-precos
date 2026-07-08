import * as z from "zod";

export const dfdSchema = z.object({
  objeto: z.string().trim().min(5, { error: "Descreva o objeto da contratação." }),
  justificativaNecessidade: z
    .string()
    .trim()
    .min(10, { error: "Descreva a necessidade que motiva a contratação." }),
  unidadeRequisitante: z.string().trim().min(2, { error: "Informe a unidade requisitante." }),
  quantidadeEstimada: z.string().trim().min(1, { error: "Informe a quantidade estimada." }),
  valorEstimado: z.string().trim().min(1, { error: "Informe o valor estimado." }),
  dataPretendida: z.string().trim().min(1, { error: "Informe a data pretendida." }),
  grauPrioridade: z.enum(["baixo", "medio", "alto"]),
  observacoes: z.string().trim().optional(),
});

export type DfdInput = z.infer<typeof dfdSchema>;

/**
 * Campos alinhados aos incisos do Art. 18, §1º da Lei 14.133/2021.
 * Os marcados como obrigatórios (I, IV, VI, VIII, XIII) seguem o §2º —
 * os demais podem ficar em branco, mas o texto gerado registra a ausência.
 */
export const etpSchema = z.object({
  descricaoNecessidade: z
    .string()
    .trim()
    .min(10, { error: "Descreva a necessidade (Art. 18, §1º, I)." }),
  alinhamentoPlanejamento: z.string().trim().optional(),
  requisitosContratacao: z.string().trim().optional(),
  levantamentoMercado: z
    .string()
    .trim()
    .min(10, { error: "Descreva o levantamento de mercado (Art. 18, §1º, IV)." }),
  estimativaQuantidades: z.string().trim().optional(),
  estimativaValor: z
    .string()
    .trim()
    .min(1, { error: "Informe a estimativa de valor (Art. 18, §1º, VI)." }),
  descricaoSolucao: z.string().trim().optional(),
  justificativaParcelamento: z
    .string()
    .trim()
    .min(5, { error: "Justifique o parcelamento ou não da contratação (Art. 18, §1º, VIII)." }),
  resultadosPretendidos: z.string().trim().optional(),
  providenciasPrevias: z.string().trim().optional(),
  contratacoesCorrelatas: z.string().trim().optional(),
  impactosAmbientais: z.string().trim().optional(),
  posicionamentoConclusivo: z
    .string()
    .trim()
    .min(5, { error: "Registre o posicionamento conclusivo (Art. 18, §1º, XIII)." }),
});

export type EtpInput = z.infer<typeof etpSchema>;

export const notaTecnicaSchema = z.object({
  assunto: z.string().trim().min(3, { error: "Informe o assunto da nota técnica." }),
  referenciaProcesso: z.string().trim().min(1, { error: "Informe o número do processo." }),
  destinatario: z.string().trim().min(2, { error: "Informe o destinatário." }),
  analise: z
    .string()
    .trim()
    .min(20, { error: "Descreva a análise técnica a ser desenvolvida." }),
  conclusao: z.string().trim().min(5, { error: "Descreva a conclusão." }),
  recomendacoes: z.string().trim().optional(),
});

export type NotaTecnicaInput = z.infer<typeof notaTecnicaSchema>;

export const documentSchemas = {
  DFD: dfdSchema,
  ETP: etpSchema,
  NOTA_TECNICA: notaTecnicaSchema,
} as const;

export type TipoDocumento = keyof typeof documentSchemas;
