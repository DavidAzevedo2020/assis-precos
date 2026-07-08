"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  notaTecnicaSchema,
  type NotaTecnicaInput,
} from "@/lib/ai/document-schemas";
import { obterUltimoDocumento } from "../actions";
import { gerarDocumentoStream } from "./gerar-documento";
import { PreviewPanel } from "./preview-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function NotaTecnicaForm({ processoId }: { processoId: string }) {
  const router = useRouter();
  const [gerando, setGerando] = useState(false);
  const [texto, setTexto] = useState("");

  const form = useForm<NotaTecnicaInput>({
    resolver: zodResolver(notaTecnicaSchema),
    defaultValues: {
      assunto: "",
      referenciaProcesso: "",
      destinatario: "",
      analise: "",
      conclusao: "",
      recomendacoes: "",
    },
  });

  async function onSubmit(dados: NotaTecnicaInput) {
    setGerando(true);
    setTexto("");
    try {
      await gerarDocumentoStream("NOTA_TECNICA", processoId, dados, setTexto);
      const docId = await obterUltimoDocumento(processoId, "NOTA_TECNICA");
      if (docId) router.push(`/processos/${processoId}/documentos/${docId}`);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao gerar a Nota Técnica.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="assunto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assunto</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="referenciaProcesso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processo de referência</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destinatario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destinatário</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="analise"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Análise técnica a ser desenvolvida</FormLabel>
                <FormControl>
                  <Textarea rows={5} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="conclusao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conclusão</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recomendacoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recomendações (opcional)</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={gerando}>
            {gerando ? "Gerando..." : "Gerar Nota Técnica"}
          </Button>
        </form>
      </Form>
      <PreviewPanel texto={texto} gerando={gerando} />
    </div>
  );
}
