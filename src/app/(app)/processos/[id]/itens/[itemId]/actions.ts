"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getItemDoUsuario } from "@/lib/data/processos";
import { db } from "@/lib/db";
import { calculos, cotacoes } from "@/lib/db/schema";
import {
  cotacaoManualSchema,
  solicitarCotacaoEmailSchema,
} from "@/lib/validation/schemas/cotacao";
import { calcularPorMetodo } from "@/lib/domain/pesquisa-precos/estatistica";
import { validarMinimoFontes } from "@/lib/domain/pesquisa-precos/validacao";
import type { Cotacao, MetodoCalculo } from "@/lib/domain/pesquisa-precos/types";
import { enviarEmail } from "@/lib/email/client";

export interface CotacaoFormState {
  errors?: Record<string, string[] | undefined>;
  message?: string;
}

const cotacaoEncontradaSchema = z.object({
  fonte: z.enum(["pncp_api", "painel_precos_api"]),
  valorUnitario: z.number().nonnegative(),
  dataCotacao: z.string().min(1),
  fornecedorOuOrigem: z.string().optional(),
  fonteDetalhe: z.unknown(),
});

export async function adicionarCotacaoManual(
  itemId: string,
  _prevState: CotacaoFormState | undefined,
  formData: FormData,
): Promise<CotacaoFormState> {
  const { processo } = await getItemDoUsuario(itemId);

  const validado = cotacaoManualSchema.safeParse({
    fonte: formData.get("fonte"),
    valorUnitario: formData.get("valorUnitario"),
    dataCotacao: formData.get("dataCotacao"),
    fornecedorOuOrigem: formData.get("fornecedorOuOrigem") || undefined,
  });

  if (!validado.success) {
    return { errors: z.flattenError(validado.error).fieldErrors };
  }

  await db.insert(cotacoes).values({
    itemId,
    fonte: validado.data.fonte,
    valorUnitario: String(validado.data.valorUnitario),
    dataCotacao: validado.data.dataCotacao,
    fonteDetalhe: validado.data.fornecedorOuOrigem
      ? { fornecedorOuOrigem: validado.data.fornecedorOuOrigem }
      : null,
  });

  revalidatePath(`/processos/${processo.id}/itens/${itemId}`);
  return {};
}

export async function adicionarCotacaoEncontrada(
  itemId: string,
  cotacaoEncontrada: unknown,
): Promise<{ ok: boolean; mensagem?: string }> {
  const { processo } = await getItemDoUsuario(itemId);

  const validado = cotacaoEncontradaSchema.safeParse(cotacaoEncontrada);
  if (!validado.success) {
    return { ok: false, mensagem: "Cotação inválida." };
  }

  await db.insert(cotacoes).values({
    itemId,
    fonte: validado.data.fonte,
    valorUnitario: String(validado.data.valorUnitario),
    dataCotacao: validado.data.dataCotacao,
    fonteDetalhe: {
      ...(validado.data.fonteDetalhe as Record<string, unknown>),
      fornecedorOuOrigem: validado.data.fornecedorOuOrigem,
    },
  });

  revalidatePath(`/processos/${processo.id}/itens/${itemId}`);
  return { ok: true };
}

export async function atualizarExclusaoCotacao(
  itemId: string,
  cotacaoId: string,
  excluida: boolean,
  motivoExclusao: string,
): Promise<void> {
  const { processo } = await getItemDoUsuario(itemId);

  await db
    .update(cotacoes)
    .set({
      excluida,
      motivoExclusao: excluida ? motivoExclusao : null,
    })
    .where(and(eq(cotacoes.id, cotacaoId), eq(cotacoes.itemId, itemId)));

  revalidatePath(`/processos/${processo.id}/itens/${itemId}`);
}

export async function removerCotacao(
  itemId: string,
  cotacaoId: string,
): Promise<void> {
  const { processo } = await getItemDoUsuario(itemId);

  await db
    .delete(cotacoes)
    .where(and(eq(cotacoes.id, cotacaoId), eq(cotacoes.itemId, itemId)));

  revalidatePath(`/processos/${processo.id}/itens/${itemId}`);
}

export async function calcularItem(
  itemId: string,
  metodo: MetodoCalculo,
): Promise<{ ok: boolean; mensagem?: string }> {
  const session = await getItemDoUsuario(itemId);

  const linhasCotacoes = await db
    .select()
    .from(cotacoes)
    .where(eq(cotacoes.itemId, itemId));

  const cotacoesDominio: Cotacao[] = linhasCotacoes.map((c) => ({
    id: c.id,
    fonte: c.fonte,
    valorUnitario: Number(c.valorUnitario),
    dataCotacao: c.dataCotacao,
    fornecedorOuOrigem:
      (c.fonteDetalhe as { fornecedorOuOrigem?: string } | null)
        ?.fornecedorOuOrigem ?? undefined,
    excluida: c.excluida,
    motivoExclusao: c.motivoExclusao ?? undefined,
  }));

  const validacao = validarMinimoFontes(cotacoesDominio);
  if (!validacao.valido) {
    return { ok: false, mensagem: validacao.mensagens.join(" ") };
  }

  const ativas = cotacoesDominio.filter((c) => !c.excluida);
  const valorResultado = calcularPorMetodo(
    ativas.map((c) => c.valorUnitario),
    metodo,
  );

  await db.insert(calculos).values({
    itemId,
    metodo,
    valorResultado: String(valorResultado),
    cotacoesConsideradasIds: ativas.map((c) => c.id),
    geradoPor: session.processo.responsavelId,
  });

  revalidatePath(`/processos/${session.processo.id}/itens/${itemId}`);
  redirect(`/processos/${session.processo.id}/itens/${itemId}/mapa`);
}

export interface SolicitarCotacaoState {
  errors?: Record<string, string[] | undefined>;
  ok?: boolean;
  message?: string;
}

const TAMANHO_MAXIMO_ANEXO_BYTES = 4 * 1024 * 1024;

/**
 * Envia um e-mail de solicitação de cotação a fornecedores (Fonte IV — Art. 5º
 * da IN 65/2021). Não registra cotação nenhuma automaticamente: a resposta do
 * fornecedor precisa ser lançada manualmente via "Entrada manual" quando
 * chegar por e-mail.
 */
export async function solicitarCotacaoPorEmail(
  itemId: string,
  _prevState: SolicitarCotacaoState | undefined,
  formData: FormData,
): Promise<SolicitarCotacaoState> {
  await getItemDoUsuario(itemId);

  const destinatarios = String(formData.get("destinatarios") ?? "")
    .split(/[,;\n]/)
    .map((email) => email.trim())
    .filter(Boolean);

  const validado = solicitarCotacaoEmailSchema.safeParse({
    destinatarios,
    assunto: formData.get("assunto"),
    mensagem: formData.get("mensagem"),
  });

  if (!validado.success) {
    return { errors: z.flattenError(validado.error).fieldErrors };
  }

  const anexo = formData.get("anexo");
  if (!(anexo instanceof File) || anexo.size === 0) {
    return { ok: false, message: "Anexe a planilha com os itens a cotar." };
  }

  if (anexo.size > TAMANHO_MAXIMO_ANEXO_BYTES) {
    return {
      ok: false,
      message: "O anexo excede o tamanho máximo permitido (4MB).",
    };
  }

  try {
    await enviarEmail({
      destinatarios: validado.data.destinatarios,
      assunto: validado.data.assunto,
      mensagem: validado.data.mensagem,
      anexo: {
        nomeArquivo: anexo.name,
        conteudo: Buffer.from(await anexo.arrayBuffer()),
      },
    });
  } catch (erro) {
    console.error("Falha ao enviar e-mail de solicitação de cotação:", erro);
    return {
      ok: false,
      message:
        "Não foi possível enviar o e-mail. Verifique a configuração SMTP (SMTP_EMAIL/SMTP_APP_PASSWORD) e tente novamente.",
    };
  }

  return {
    ok: true,
    message: `E-mail enviado para ${validado.data.destinatarios.length} fornecedor(es).`,
  };
}
