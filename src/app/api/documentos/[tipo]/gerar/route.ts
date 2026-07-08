import { and, desc, eq } from "drizzle-orm";
import { verifySession } from "@/lib/dal";
import { db } from "@/lib/db";
import { documentos, processos } from "@/lib/db/schema";
import { anthropic } from "@/lib/ai/anthropic-client";
import { CLAUDE_MODEL, MAX_TOKENS_POR_TIPO } from "@/lib/ai/config";
import { documentPromptRegistry } from "@/lib/ai/prompts";
import type { TipoDocumento } from "@/lib/ai/document-schemas";

const TIPOS_VALIDOS: readonly TipoDocumento[] = ["DFD", "ETP", "NOTA_TECNICA"];

function isTipoDocumento(valor: string): valor is TipoDocumento {
  return (TIPOS_VALIDOS as readonly string[]).includes(valor);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tipo: string }> },
) {
  const session = await verifySession();
  const { tipo: tipoParam } = await params;

  if (!isTipoDocumento(tipoParam)) {
    return Response.json(
      { error: "Tipo de documento inválido." },
      { status: 400 },
    );
  }
  const tipo = tipoParam;

  const body = await request.json().catch(() => null);
  const processoId = body?.processoId;

  if (typeof processoId !== "string") {
    return Response.json(
      { error: "processoId é obrigatório." },
      { status: 400 },
    );
  }

  const { schema, systemPrompt, buildUserMessage } =
    documentPromptRegistry[tipo];

  const validado = schema.safeParse(body?.camposEstruturados);
  if (!validado.success) {
    return Response.json(
      { error: "Campos inválidos.", detalhes: validado.error.issues },
      { status: 400 },
    );
  }

  const [processo] = await db
    .select({ id: processos.id })
    .from(processos)
    .where(
      and(
        eq(processos.id, processoId),
        eq(processos.responsavelId, session.userId),
      ),
    );

  if (!processo) {
    return Response.json(
      { error: "Processo não encontrado." },
      { status: 404 },
    );
  }

  const [ultimo] = await db
    .select({ versao: documentos.versao })
    .from(documentos)
    .where(and(eq(documentos.processoId, processoId), eq(documentos.tipo, tipo)))
    .orderBy(desc(documentos.versao))
    .limit(1);
  const proximaVersao = (ultimo?.versao ?? 0) + 1;

  // buildUserMessage espera o tipo específico do schema correspondente — já
  // garantido pelo safeParse acima, mas o TS não consegue provar essa relação
  // através do registro genérico.
  const userMessage = (buildUserMessage as (campos: unknown) => string)(
    validado.data,
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let textoCompleto = "";

      try {
        const anthropicStream = anthropic.messages.stream({
          model: CLAUDE_MODEL,
          max_tokens: MAX_TOKENS_POR_TIPO[tipo],
          system: [
            { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
          ],
          messages: [{ role: "user", content: userMessage }],
        });

        anthropicStream.on("text", (delta) => {
          textoCompleto += delta;
          controller.enqueue(encoder.encode(delta));
        });

        const finalMessage = await anthropicStream.finalMessage();

        const status =
          finalMessage.stop_reason === "max_tokens" ? "rascunho" : "gerado";

        await db.insert(documentos).values({
          processoId,
          tipo,
          camposEstruturados: validado.data,
          textoGerado: textoCompleto,
          versao: proximaVersao,
          status,
          modeloIaUsado: finalMessage.model,
          tokensInput: finalMessage.usage.input_tokens,
          tokensOutput: finalMessage.usage.output_tokens,
        });
      } catch (erro) {
        controller.error(erro);
        return;
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
