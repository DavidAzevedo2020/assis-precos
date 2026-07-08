"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { dfdSchema, type DfdInput } from "@/lib/ai/document-schemas";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DfdForm({ processoId }: { processoId: string }) {
  const router = useRouter();
  const [gerando, setGerando] = useState(false);
  const [texto, setTexto] = useState("");

  const form = useForm<DfdInput>({
    resolver: zodResolver(dfdSchema),
    defaultValues: {
      objeto: "",
      justificativaNecessidade: "",
      unidadeRequisitante: "",
      quantidadeEstimada: "",
      valorEstimado: "",
      dataPretendida: "",
      grauPrioridade: "medio",
      observacoes: "",
    },
  });

  async function onSubmit(dados: DfdInput) {
    setGerando(true);
    setTexto("");
    try {
      await gerarDocumentoStream("DFD", processoId, dados, setTexto);
      const docId = await obterUltimoDocumento(processoId, "DFD");
      if (docId) router.push(`/processos/${processoId}/documentos/${docId}`);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao gerar o DFD.");
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
            name="unidadeRequisitante"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidade requisitante</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="objeto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Objeto</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="justificativaNecessidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Justificativa da necessidade</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="quantidadeEstimada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade estimada</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valorEstimado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor estimado</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dataPretendida"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data pretendida</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grauPrioridade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grau de prioridade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="baixo">Baixo</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações (opcional)</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={gerando}>
            {gerando ? "Gerando..." : "Gerar DFD"}
          </Button>
        </form>
      </Form>
      <PreviewPanel texto={texto} gerando={gerando} />
    </div>
  );
}
