import type { Metadata } from "next";
import { getProcessoDoUsuario } from "@/lib/data/processos";
import { ItemForm } from "./item-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = { title: "Novo item" };

export default async function NovoItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const processo = await getProcessoDoUsuario(id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Breadcrumbs
        items={[
          { label: processo.numeroProcesso, href: `/processos/${id}` },
          { label: "Novo item" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold">Novo item</h1>
        <p className="text-muted-foreground">
          Cadastre o item cuja pesquisa de preços será realizada.
        </p>
      </div>
      <ItemForm processoId={id} />
    </div>
  );
}
