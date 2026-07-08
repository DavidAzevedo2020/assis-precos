import type { Metadata } from "next";
import { getProcessoDoUsuario } from "@/lib/data/processos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DfdForm } from "./dfd-form";
import { EtpForm } from "./etp-form";
import { NotaTecnicaForm } from "./nota-tecnica-form";

export const metadata: Metadata = { title: "Novo documento" };

export default async function NovoDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getProcessoDoUsuario(id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo documento</h1>
        <p className="text-muted-foreground">
          Preencha os campos e a redação formal será gerada automaticamente.
        </p>
      </div>

      <Tabs defaultValue="DFD">
        <TabsList>
          <TabsTrigger value="DFD">DFD</TabsTrigger>
          <TabsTrigger value="ETP">ETP</TabsTrigger>
          <TabsTrigger value="NOTA_TECNICA">Nota Técnica</TabsTrigger>
        </TabsList>
        <TabsContent value="DFD" className="pt-4">
          <DfdForm processoId={id} />
        </TabsContent>
        <TabsContent value="ETP" className="pt-4">
          <EtpForm processoId={id} />
        </TabsContent>
        <TabsContent value="NOTA_TECNICA" className="pt-4">
          <NotaTecnicaForm processoId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
