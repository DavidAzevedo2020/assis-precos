import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Supabase manages the `auth` schema. We only declare the columns we
 * reference from `profiles`, never migrate this table ourselves.
 */
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const processoStatusEnum = pgEnum("processo_status", [
  "rascunho",
  "em_pesquisa",
  "pesquisa_concluida",
  "documentos_gerados",
  "finalizado",
]);

export const fonteCotacaoEnum = pgEnum("fonte_cotacao", [
  "painel_precos_api",
  "pncp_api",
  "midia_especializada",
  "pesquisa_direta",
  "nota_fiscal",
]);

export const metodoCalculoEnum = pgEnum("metodo_calculo", [
  "media",
  "mediana",
  "menor_valor",
]);

export const tipoDocumentoEnum = pgEnum("tipo_documento", [
  "DFD",
  "ETP",
  "NOTA_TECNICA",
]);

export const statusDocumentoEnum = pgEnum("status_documento", [
  "rascunho",
  "gerado",
  "revisado",
  "final",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  cargo: text("cargo"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const processos = pgTable("processos", {
  id: uuid("id").primaryKey().defaultRandom(),
  numeroProcesso: text("numero_processo").notNull(),
  objeto: text("objeto").notNull(),
  status: processoStatusEnum("status").default("rascunho").notNull(),
  responsavelId: uuid("responsavel_id")
    .references(() => profiles.id, { onDelete: "restrict" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const itens = pgTable("itens", {
  id: uuid("id").primaryKey().defaultRandom(),
  processoId: uuid("processo_id")
    .references(() => processos.id, { onDelete: "cascade" })
    .notNull(),
  descricao: text("descricao").notNull(),
  unidadeMedida: text("unidade_medida").notNull(),
  quantidade: numeric("quantidade", { precision: 18, scale: 4 }).notNull(),
  catmatCatserCodigo: text("catmat_catser_codigo"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const cotacoes = pgTable("cotacoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id")
    .references(() => itens.id, { onDelete: "cascade" })
    .notNull(),
  fonte: fonteCotacaoEnum("fonte").notNull(),
  /** Payload bruto da API ou metadados manuais (fornecedor, CNPJ, link, nº NF) */
  fonteDetalhe: jsonb("fonte_detalhe"),
  valorUnitario: numeric("valor_unitario", {
    precision: 18,
    scale: 4,
  }).notNull(),
  dataCotacao: date("data_cotacao").notNull(),
  excluida: boolean("excluida").default(false).notNull(),
  /** Obrigatório quando excluida = true (Art. 6º da IN 65/2021) */
  motivoExclusao: text("motivo_exclusao"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const calculos = pgTable("calculos", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id")
    .references(() => itens.id, { onDelete: "cascade" })
    .notNull(),
  metodo: metodoCalculoEnum("metodo").notNull(),
  valorResultado: numeric("valor_resultado", {
    precision: 18,
    scale: 4,
  }).notNull(),
  cotacoesConsideradasIds: uuid("cotacoes_consideradas_ids").array().notNull(),
  criteriosExclusao: text("criterios_exclusao"),
  geradoPor: uuid("gerado_por")
    .references(() => profiles.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const documentos = pgTable("documentos", {
  id: uuid("id").primaryKey().defaultRandom(),
  processoId: uuid("processo_id")
    .references(() => processos.id, { onDelete: "cascade" })
    .notNull(),
  tipo: tipoDocumentoEnum("tipo").notNull(),
  camposEstruturados: jsonb("campos_estruturados").notNull(),
  textoGerado: text("texto_gerado"),
  versao: integer("versao").default(1).notNull(),
  status: statusDocumentoEnum("status").default("rascunho").notNull(),
  modeloIaUsado: text("modelo_ia_usado"),
  tokensInput: integer("tokens_input"),
  tokensOutput: integer("tokens_output"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  processos: many(processos),
}));

export const processosRelations = relations(processos, ({ one, many }) => ({
  responsavel: one(profiles, {
    fields: [processos.responsavelId],
    references: [profiles.id],
  }),
  itens: many(itens),
  documentos: many(documentos),
}));

export const itensRelations = relations(itens, ({ one, many }) => ({
  processo: one(processos, {
    fields: [itens.processoId],
    references: [processos.id],
  }),
  cotacoes: many(cotacoes),
  calculos: many(calculos),
}));

export const cotacoesRelations = relations(cotacoes, ({ one }) => ({
  item: one(itens, {
    fields: [cotacoes.itemId],
    references: [itens.id],
  }),
}));

export const calculosRelations = relations(calculos, ({ one }) => ({
  item: one(itens, {
    fields: [calculos.itemId],
    references: [itens.id],
  }),
  geradoPorProfile: one(profiles, {
    fields: [calculos.geradoPor],
    references: [profiles.id],
  }),
}));

export const documentosRelations = relations(documentos, ({ one }) => ({
  processo: one(processos, {
    fields: [documentos.processoId],
    references: [processos.id],
  }),
}));
