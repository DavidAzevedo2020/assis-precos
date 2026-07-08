"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PreviewPanel({
  texto,
  gerando,
}: {
  texto: string;
  gerando: boolean;
}) {
  if (!texto && !gerando) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{gerando ? "Gerando documento..." : "Pré-visualização"}</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap font-sans text-sm">
          {texto}
          {gerando && <span className="animate-pulse">▌</span>}
        </pre>
      </CardContent>
    </Card>
  );
}
