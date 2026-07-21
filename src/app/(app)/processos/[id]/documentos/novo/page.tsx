import type { Metadata } from "next";
import {
  getProcessoDoUsuario,
  obterResumoPesquisaDoProcesso,
} from "@/lib/data/processos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DfdForm } from "./dfd-form";
import { EtpForm } from "./etp-form";
import { NotaTecnicaForm } from "./nota-tecnica-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = { title: "Novo documento" };

export default async function NovoDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const processo = await getProcessoDoUsuario(id);
  const resumo = await obterResumoPesquisaDoProcesso(id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: processo.numeroProcesso, href: `/processos/${id}` },
          { label: "Novo documento" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-semibold">Novo documento</h1>
        <p className="text-muted-foreground">
          Preencha os campos e a redação formal será gerada automaticamente.
        </p>
      </div>

      {resumo.quantidadeEstimadaTexto && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Quantidade e valor estimados foram pré-preenchidos a partir da
          pesquisa de preços deste processo — revise antes de gerar o
          documento.
          {resumo.itensSemPreco.length > 0 && (
            <>
              {" "}
              <span className="font-medium text-destructive">
                Atenção:
              </span>{" "}
              os itens {resumo.itensSemPreco.join(", ")} ainda não têm preço
              de referência calculado; o valor total pode estar incompleto.
            </>
          )}
        </p>
      )}

      <Tabs defaultValue="DFD">
        <TabsList>
          <TabsTrigger value="DFD">DFD</TabsTrigger>
          <TabsTrigger value="ETP">ETP</TabsTrigger>
          <TabsTrigger value="NOTA_TECNICA">Nota Técnica</TabsTrigger>
        </TabsList>
        <TabsContent value="DFD" className="pt-4">
          <DfdForm processoId={id} resumo={resumo} />
        </TabsContent>
        <TabsContent value="ETP" className="pt-4">
          <EtpForm processoId={id} resumo={resumo} />
        </TabsContent>
        <TabsContent value="NOTA_TECNICA" className="pt-4">
          <NotaTecnicaForm processoId={id} resumo={resumo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
