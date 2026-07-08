"use client";

import { useActionState } from "react";
import { criarItem, type ItemFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function ItemForm({ processoId }: { processoId: string }) {
  const criarItemComProcesso = criarItem.bind(null, processoId);
  const [state, action, pending] = useActionState<
    ItemFormState | undefined,
    FormData
  >(criarItemComProcesso, undefined);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição do item</Label>
            <Input id="descricao" name="descricao" placeholder="Ex: Papel A4 75g/m²" required />
            {state?.errors?.descricao && (
              <p className="text-sm text-destructive">{state.errors.descricao[0]}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unidadeMedida">Unidade de medida</Label>
              <Input id="unidadeMedida" name="unidadeMedida" placeholder="Ex: resma" required />
              {state?.errors?.unidadeMedida && (
                <p className="text-sm text-destructive">{state.errors.unidadeMedida[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input id="quantidade" name="quantidade" type="number" step="any" min="0" required />
              {state?.errors?.quantidade && (
                <p className="text-sm text-destructive">{state.errors.quantidade[0]}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="catmatCatserCodigo">Código CATMAT/CATSER (opcional)</Label>
            <Input
              id="catmatCatserCodigo"
              name="catmatCatserCodigo"
              placeholder="Facilita a busca automática de preços"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Criando..." : "Criar item"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
