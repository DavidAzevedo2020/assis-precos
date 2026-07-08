import type { Metadata } from "next";
import { getDocumentoDoUsuario } from "@/lib/data/processos";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentoAcoes } from "./documento-acoes";

export const metadata: Metadata = { title: "Documento" };

const TIPO_LABEL: Record<string, string> = {
  DFD: "Documento de Formalização de Demanda",
  ETP: "Estudo Técnico Preliminar",
  NOTA_TECNICA: "Nota Técnica",
};

export default async function DocumentoPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = await params;
  const { documento } = await getDocumentoDoUsuario(docId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">
            {TIPO_LABEL[documento.tipo] ?? documento.tipo}
          </h1>
          <p className="text-muted-foreground">
            Versão {documento.versao} — gerado com {documento.modeloIaUsado}
          </p>
        </div>
        <Badge variant="secondary">{documento.status}</Badge>
      </div>

      <DocumentoAcoes
        processoId={id}
        documentoId={docId}
        statusAtual={documento.status}
      />

      <Card>
        <CardContent className="pt-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {documento.textoGerado}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
