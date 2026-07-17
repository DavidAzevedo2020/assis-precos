"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import {
  solicitarCotacaoPorEmail,
  type SolicitarCotacaoState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function mensagemPadrao(itemDescricao: string, codigoCatalogo?: string | null) {
  return `Prezados,

Solicitamos cotação de preços para o item abaixo, conforme planilha anexa, para fins de pesquisa de preços em processo de contratação pública (Art. 5º, IV da IN SEGES/ME nº 65/2021):

Item: ${itemDescricao}${codigoCatalogo ? `\nCódigo CATMAT/CATSER: ${codigoCatalogo}` : ""}

Solicitamos retorno com os valores unitários e o prazo de validade da proposta.

Atenciosamente,`;
}

export function SolicitarCotacaoForm({
  itemId,
  itemDescricao,
  codigoCatalogo,
}: {
  itemId: string;
  itemDescricao: string;
  codigoCatalogo?: string | null;
}) {
  const solicitarComItem = solicitarCotacaoPorEmail.bind(null, itemId);
  const [state, action, pending] = useActionState<
    SolicitarCotacaoState | undefined,
    FormData
  >(solicitarComItem, undefined);

  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Fonte IV (Art. 5º da IN 65/2021): pesquisa direta com fornecedores.
        São exigidos no mínimo 3 fornecedores quando essa for a única fonte
        usada. As respostas recebidas por e-mail precisam ser lançadas depois
        na aba &quot;Entrada manual&quot;.
      </p>

      <div className="space-y-1">
        <Label htmlFor="destinatarios">
          E-mails dos fornecedores (separados por vírgula ou um por linha)
        </Label>
        <Textarea
          id="destinatarios"
          name="destinatarios"
          required
          rows={2}
          placeholder="fornecedor1@empresa.com, fornecedor2@empresa.com, fornecedor3@empresa.com"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="assunto">Assunto</Label>
        <Input
          id="assunto"
          name="assunto"
          required
          defaultValue={`Solicitação de cotação de preços — ${itemDescricao}`}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="mensagem">Mensagem</Label>
        <Textarea
          id="mensagem"
          name="mensagem"
          required
          rows={9}
          defaultValue={mensagemPadrao(itemDescricao, codigoCatalogo)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="anexo">Planilha com os itens</Label>
        <Input
          id="anexo"
          name="anexo"
          type="file"
          required
          accept=".xlsx,.xls,.csv,.pdf"
        />
      </div>

      <Button type="submit" disabled={pending}>
        <Mail className="size-4" />
        {pending ? "Enviando..." : "Enviar solicitação"}
      </Button>

      {state?.errors && (
        <p className="text-sm text-destructive">
          {Object.values(state.errors).flat().filter(Boolean).join(" ")}
        </p>
      )}
      {state?.message && !state.errors && (
        <p
          className={cn(
            "text-sm",
            state.ok ? "text-muted-foreground" : "text-destructive",
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
