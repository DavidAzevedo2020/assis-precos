import type { TipoDocumento } from "@/lib/ai/document-schemas";

export async function gerarDocumentoStream(
  tipo: TipoDocumento,
  processoId: string,
  camposEstruturados: unknown,
  onDelta: (chunkAcumulado: string) => void,
): Promise<void> {
  const resposta = await fetch(`/api/documentos/${tipo}/gerar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ processoId, camposEstruturados }),
  });

  if (!resposta.ok || !resposta.body) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.error ?? "Falha ao gerar o documento.");
  }

  const reader = resposta.body.getReader();
  const decoder = new TextDecoder();
  let acumulado = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    acumulado += decoder.decode(value, { stream: true });
    onDelta(acumulado);
  }
}
