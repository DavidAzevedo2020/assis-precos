"use client";

import { useTransition } from "react";
import { Printer } from "lucide-react";
import { atualizarStatusDocumento } from "../actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPCOES = [
  { value: "rascunho", label: "Rascunho" },
  { value: "gerado", label: "Gerado" },
  { value: "revisado", label: "Revisado" },
  { value: "final", label: "Final" },
];

export function DocumentoAcoes({
  processoId,
  documentoId,
  statusAtual,
}: {
  processoId: string;
  documentoId: string;
  statusAtual: string;
}) {
  const [pending, startTransition] = useTransition();

  function mudarStatus(status: string | null) {
    if (!status) return;
    startTransition(() => {
      atualizarStatusDocumento(
        processoId,
        documentoId,
        status as "rascunho" | "gerado" | "revisado" | "final",
      );
    });
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Select value={statusAtual} onValueChange={mudarStatus} disabled={pending}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPCOES.map((opcao) => (
            <SelectItem key={opcao.value} value={opcao.value}>
              {opcao.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" variant="outline" onClick={() => window.print()}>
        <Printer className="size-4" />
        Exportar / Imprimir
      </Button>
    </div>
  );
}
