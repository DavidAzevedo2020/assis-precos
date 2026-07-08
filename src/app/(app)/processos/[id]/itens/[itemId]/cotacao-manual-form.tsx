"use client";

import { useActionState } from "react";
import {
  adicionarCotacaoManual,
  type CotacaoFormState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FONTES_MANUAIS = [
  { value: "midia_especializada", label: "Mídia especializada / sítio eletrônico" },
  { value: "pesquisa_direta", label: "Pesquisa direta com fornecedor" },
  { value: "nota_fiscal", label: "Nota fiscal eletrônica" },
];

export function CotacaoManualForm({ itemId }: { itemId: string }) {
  const adicionarComItem = adicionarCotacaoManual.bind(null, itemId);
  const [state, action, pending] = useActionState<
    CotacaoFormState | undefined,
    FormData
  >(adicionarComItem, undefined);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-5 sm:items-end">
      <div className="space-y-1 sm:col-span-2">
        <Label>Fonte</Label>
        <Select name="fonte" defaultValue="pesquisa_direta">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONTES_MANUAIS.map((fonte) => (
              <SelectItem key={fonte.value} value={fonte.value}>
                {fonte.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="valorUnitario">Valor (R$)</Label>
        <Input id="valorUnitario" name="valorUnitario" type="number" step="0.01" min="0" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="dataCotacao">Data</Label>
        <Input id="dataCotacao" name="dataCotacao" type="date" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="fornecedorOuOrigem">Fornecedor/origem</Label>
        <Input id="fornecedorOuOrigem" name="fornecedorOuOrigem" placeholder="Opcional" />
      </div>
      <Button type="submit" disabled={pending} className="sm:col-span-5 sm:w-fit">
        {pending ? "Adicionando..." : "Adicionar cotação"}
      </Button>
      {state?.errors && (
        <p className="text-sm text-destructive sm:col-span-5">
          {Object.values(state.errors).flat().filter(Boolean).join(" ")}
        </p>
      )}
    </form>
  );
}
