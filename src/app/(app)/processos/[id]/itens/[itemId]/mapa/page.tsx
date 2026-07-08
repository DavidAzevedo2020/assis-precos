import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { getItemDoUsuario } from "@/lib/data/processos";
import { db } from "@/lib/db";
import { calculos, cotacoes } from "@/lib/db/schema";
import { gerarMapaComparativo } from "@/lib/domain/pesquisa-precos/mapa-comparativo";
import { gerarMemoriaCalculo } from "@/lib/domain/pesquisa-precos/memoria-calculo";
import type { Cotacao } from "@/lib/domain/pesquisa-precos/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Mapa comparativo" };

const FONTE_LABEL: Record<string, string> = {
  painel_precos_api: "Compras.gov.br (I)",
  pncp_api: "PNCP (II)",
  midia_especializada: "Mídia especializada (III)",
  pesquisa_direta: "Pesquisa direta (IV)",
  nota_fiscal: "Nota fiscal (V)",
};

const METODO_LABEL: Record<string, string> = {
  media: "Média",
  mediana: "Mediana",
  menor_valor: "Menor valor",
};

export default async function MapaComparativoPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { itemId } = await params;
  const { item } = await getItemDoUsuario(itemId);

  const [linhasCotacoes, [ultimoCalculo]] = await Promise.all([
    db.select().from(cotacoes).where(eq(cotacoes.itemId, itemId)),
    db
      .select()
      .from(calculos)
      .where(eq(calculos.itemId, itemId))
      .orderBy(desc(calculos.createdAt))
      .limit(1),
  ]);

  const cotacoesDominio: Cotacao[] = linhasCotacoes.map((c) => ({
    id: c.id,
    fonte: c.fonte,
    valorUnitario: Number(c.valorUnitario),
    dataCotacao: c.dataCotacao,
    fornecedorOuOrigem: (c.fonteDetalhe as { fornecedorOuOrigem?: string } | null)
      ?.fornecedorOuOrigem,
    excluida: c.excluida,
    motivoExclusao: c.motivoExclusao ?? undefined,
  }));

  const itemDominio = {
    id: item.id,
    descricao: item.descricao,
    unidadeMedida: item.unidadeMedida,
  };

  const mapa = gerarMapaComparativo(itemDominio, cotacoesDominio);
  const memoria = ultimoCalculo
    ? gerarMemoriaCalculo(
        itemDominio,
        cotacoesDominio,
        ultimoCalculo.metodo,
        Number(ultimoCalculo.valorResultado),
      )
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mapa comparativo de preços</h1>
        <p className="text-muted-foreground">{item.descricao}</p>
      </div>

      {memoria ? (
        <Alert>
          <AlertTitle>
            {METODO_LABEL[memoria.metodo]}: R$ {memoria.valorResultado.toFixed(2)}
          </AlertTitle>
          <AlertDescription>
            Calculado com {memoria.totalCotacoesConsideradas} de{" "}
            {memoria.totalCotacoesConsideradas + memoria.totalCotacoesExcluidas}{" "}
            cotações coletadas (Art. 6º da IN SEGES/ME nº 65/2021).
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTitle>Nenhum cálculo realizado ainda</AlertTitle>
          <AlertDescription>
            Volte à página do item e utilize o botão &quot;Calcular preço de
            referência&quot;.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Série de preços coletados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fonte</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mapa.linhas.map((linha) => (
                <TableRow key={linha.cotacaoId}>
                  <TableCell>{FONTE_LABEL[linha.fonte] ?? linha.fonte}</TableCell>
                  <TableCell>R$ {linha.valorUnitario.toFixed(2)}</TableCell>
                  <TableCell>{linha.dataCotacao}</TableCell>
                  <TableCell>{linha.fornecedorOuOrigem ?? "—"}</TableCell>
                  <TableCell>
                    {linha.situacao === "excluida" ? (
                      <Badge variant="destructive" title={linha.motivoExclusao}>
                        Excluída
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Considerada</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {memoria && (
        <Card>
          <CardHeader>
            <CardTitle>Memória de cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {memoria.textoFormatado}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
