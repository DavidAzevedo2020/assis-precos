CREATE TYPE "public"."fonte_cotacao" AS ENUM('painel_precos_api', 'pncp_api', 'midia_especializada', 'pesquisa_direta', 'nota_fiscal');--> statement-breakpoint
CREATE TYPE "public"."metodo_calculo" AS ENUM('media', 'mediana', 'menor_valor');--> statement-breakpoint
CREATE TYPE "public"."processo_status" AS ENUM('rascunho', 'em_pesquisa', 'pesquisa_concluida', 'documentos_gerados', 'finalizado');--> statement-breakpoint
CREATE TYPE "public"."status_documento" AS ENUM('rascunho', 'gerado', 'revisado', 'final');--> statement-breakpoint
CREATE TYPE "public"."tipo_documento" AS ENUM('DFD', 'ETP', 'NOTA_TECNICA');--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calculos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"metodo" "metodo_calculo" NOT NULL,
	"valor_resultado" numeric(18, 4) NOT NULL,
	"cotacoes_consideradas_ids" uuid[] NOT NULL,
	"criterios_exclusao" text,
	"gerado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cotacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"fonte" "fonte_cotacao" NOT NULL,
	"fonte_detalhe" jsonb,
	"valor_unitario" numeric(18, 4) NOT NULL,
	"data_cotacao" date NOT NULL,
	"excluida" boolean DEFAULT false NOT NULL,
	"motivo_exclusao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processo_id" uuid NOT NULL,
	"tipo" "tipo_documento" NOT NULL,
	"campos_estruturados" jsonb NOT NULL,
	"texto_gerado" text,
	"versao" integer DEFAULT 1 NOT NULL,
	"status" "status_documento" DEFAULT 'rascunho' NOT NULL,
	"modelo_ia_usado" text,
	"tokens_input" integer,
	"tokens_output" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processo_id" uuid NOT NULL,
	"descricao" text NOT NULL,
	"unidade_medida" text NOT NULL,
	"quantidade" numeric(18, 4) NOT NULL,
	"catmat_catser_codigo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero_processo" text NOT NULL,
	"objeto" text NOT NULL,
	"status" "processo_status" DEFAULT 'rascunho' NOT NULL,
	"responsavel_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"cargo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calculos" ADD CONSTRAINT "calculos_item_id_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."itens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculos" ADD CONSTRAINT "calculos_gerado_por_profiles_id_fk" FOREIGN KEY ("gerado_por") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotacoes" ADD CONSTRAINT "cotacoes_item_id_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."itens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_processo_id_processos_id_fk" FOREIGN KEY ("processo_id") REFERENCES "public"."processos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens" ADD CONSTRAINT "itens_processo_id_processos_id_fk" FOREIGN KEY ("processo_id") REFERENCES "public"."processos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processos" ADD CONSTRAINT "processos_responsavel_id_profiles_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;