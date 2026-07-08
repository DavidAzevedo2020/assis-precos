import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { FileText, Plus } from "lucide-react";
import { getProcessoDoUsuario } from "@/lib/data/processos";
import { db } from "@/lib/db";
import { documentos, itens } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Processo" };

const TIPO_DOCUMENTO_LABEL: Record<string, string> = {
  DFD: "DFD",
  ETP: "ETP",
  NOTA_TECNICA: "Nota Técnica",
};

export default async function ProcessoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const processo = await getProcessoDoUsuario(id);

  const [itensDoProcesso, documentosDoProcesso] = await Promise.all([
    db.select().from(itens).where(eq(itens.processoId, id)),
    db.select().from(documentos).where(eq(documentos.processoId, id)),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{processo.numeroProcesso}</h1>
        <p className="text-muted-foreground">{processo.objeto}</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Itens pesquisados</h2>
          <Button render={<Link href={`/processos/${id}/itens/novo`} />} size="sm" variant="outline">
            <Plus className="size-4" />
            Novo item
          </Button>
        </div>

        {itensDoProcesso.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum item cadastrado ainda.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {itensDoProcesso.map((item) => (
              <Link key={item.id} href={`/processos/${id}/itens/${item.id}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader>
                    <CardTitle className="text-base">{item.descricao}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {item.quantidade} {item.unidadeMedida}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Documentos</h2>
          <Button render={<Link href={`/processos/${id}/documentos/novo`} />} size="sm" variant="outline">
            <Plus className="size-4" />
            Novo documento
          </Button>
        </div>

        {documentosDoProcesso.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum documento gerado ainda.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {documentosDoProcesso.map((documento) => (
              <Link
                key={documento.id}
                href={`/processos/${id}/documentos/${documento.id}`}
              >
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="size-4" />
                        {TIPO_DOCUMENTO_LABEL[documento.tipo] ?? documento.tipo}
                      </CardTitle>
                      <Badge variant="secondary">v{documento.versao}</Badge>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
