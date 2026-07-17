import type { Metadata } from "next";
import { ProcessoForm } from "./processo-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = { title: "Novo processo" };

export default function NovoProcessoPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Breadcrumbs items={[{ label: "Novo processo" }]} />
      <div>
        <h1 className="text-2xl font-semibold">Novo processo</h1>
        <p className="text-muted-foreground">
          Cadastre o processo licitatório para iniciar a pesquisa de preços e a
          geração de documentos.
        </p>
      </div>
      <ProcessoForm />
    </div>
  );
}
