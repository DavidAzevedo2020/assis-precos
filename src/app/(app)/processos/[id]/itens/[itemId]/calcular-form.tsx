"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Calculator } from "lucide-react";
import { calcularItem } from "./actions";
import type { MetodoCalculo } from "@/lib/domain/pesquisa-precos/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const METODOS: { value: MetodoCalculo; label: string }[] = [
  { value: "media", label: "Média" },
  { value: "mediana", label: "Mediana" },
  { value: "menor_valor", label: "Menor valor" },
];

export function CalcularForm({ itemId }: { itemId: string }) {
  const [metodo, setMetodo] = useState<MetodoCalculo>("mediana");
  const [pending, startTransition] = useTransition();

  function calcular() {
    startTransition(async () => {
      const resultado = await calcularItem(itemId, metodo);
      if (resultado && !resultado.ok) {
        toast.error(resultado.mensagem ?? "Não foi possível calcular.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <span className="text-sm font-medium">Método estatístico</span>
        <Select value={metodo} onValueChange={(v) => v && setMetodo(v as MetodoCalculo)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METODOS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" onClick={calcular} disabled={pending}>
        <Calculator className="size-4" />
        {pending ? "Calculando..." : "Calcular preço de referência"}
      </Button>
    </div>
  );
}
