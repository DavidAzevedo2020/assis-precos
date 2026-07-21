"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { etpSchema, type EtpInput } from "@/lib/ai/document-schemas";
import type { ResumoPesquisaProcesso } from "@/lib/data/processos";
import { obterUltimoDocumento } from "../actions";
import { gerarDocumentoStream } from "./gerar-documento";
import { PreviewPanel } from "./preview-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const CAMPOS: {
  nome: keyof EtpInput;
  label: string;
  obrigatorio: boolean;
}[] = [
  { nome: "descricaoNecessidade", label: "I - Descrição da necessidade", obrigatorio: true },
  { nome: "alinhamentoPlanejamento", label: "II - Alinhamento com o planejamento", obrigatorio: false },
  { nome: "requisitosContratacao", label: "III - Requisitos da contratação", obrigatorio: false },
  { nome: "levantamentoMercado", label: "IV - Levantamento de mercado", obrigatorio: true },
  { nome: "estimativaQuantidades", label: "V - Estimativa de quantidades", obrigatorio: false },
  { nome: "estimativaValor", label: "VI - Estimativa de valor", obrigatorio: true },
  { nome: "descricaoSolucao", label: "VII - Descrição da solução", obrigatorio: false },
  { nome: "justificativaParcelamento", label: "VIII - Justificativa de parcelamento", obrigatorio: true },
  { nome: "resultadosPretendidos", label: "IX - Resultados pretendidos", obrigatorio: false },
  { nome: "providenciasPrevias", label: "X - Providências prévias", obrigatorio: false },
  { nome: "contratacoesCorrelatas", label: "XI - Contratações correlatas", obrigatorio: false },
  { nome: "impactosAmbientais", label: "XII - Impactos ambientais", obrigatorio: false },
  { nome: "posicionamentoConclusivo", label: "XIII - Posicionamento conclusivo", obrigatorio: true },
];

export function EtpForm({
  processoId,
  resumo,
}: {
  processoId: string;
  resumo: ResumoPesquisaProcesso;
}) {
  const router = useRouter();
  const [gerando, setGerando] = useState(false);
  const [texto, setTexto] = useState("");

  const form = useForm<EtpInput>({
    resolver: zodResolver(etpSchema),
    defaultValues: {
      ...(Object.fromEntries(CAMPOS.map((c) => [c.nome, ""])) as EtpInput),
      estimativaQuantidades: resumo.quantidadeEstimadaTexto,
      estimativaValor: resumo.valorEstimadoTexto,
    },
  });

  async function onSubmit(dados: EtpInput) {
    setGerando(true);
    setTexto("");
    try {
      await gerarDocumentoStream("ETP", processoId, dados, setTexto);
      const docId = await obterUltimoDocumento(processoId, "ETP");
      if (docId) router.push(`/processos/${processoId}/documentos/${docId}`);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao gerar o ETP.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Os incisos marcados com <span className="font-medium">*</span> são
        obrigatórios (Art. 18, §2º da Lei 14.133/2021). Os demais podem ficar
        em branco — o texto gerado registrará a ausência com justificativa.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {CAMPOS.map((campo) => (
            <FormField
              key={campo.nome}
              control={form.control}
              name={campo.nome}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {campo.label}
                    {campo.obrigatorio && <span className="text-destructive"> *</span>}
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={campo.obrigatorio ? 3 : 2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <Button type="submit" disabled={gerando}>
            {gerando ? "Gerando..." : "Gerar ETP"}
          </Button>
        </form>
      </Form>
      <PreviewPanel texto={texto} gerando={gerando} />
    </div>
  );
}
