"use client";

import { useActionState } from "react";
import { criarProcesso } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ProcessoForm() {
  const [state, action, pending] = useActionState(criarProcesso, undefined);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="numeroProcesso">Número do processo</Label>
            <Input id="numeroProcesso" name="numeroProcesso" placeholder="Ex: 59000.001234/2026-10" required />
            {state?.errors?.numeroProcesso && (
              <p className="text-sm text-destructive">{state.errors.numeroProcesso[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="objeto">Objeto</Label>
            <Textarea
              id="objeto"
              name="objeto"
              placeholder="Descreva o objeto da contratação"
              rows={4}
              required
            />
            {state?.errors?.objeto && (
              <p className="text-sm text-destructive">{state.errors.objeto[0]}</p>
            )}
          </div>
          {state?.message && (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Criando..." : "Criar processo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
