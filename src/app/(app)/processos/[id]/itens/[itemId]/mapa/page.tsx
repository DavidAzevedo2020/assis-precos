import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { getItemDoUsuario } from "@/lib/data/processos";
import { db } from "@/lib/db";
import { calculos, cotacoes } from "@/lib/db/schema";
import { gerarMapaComparativo } from "@/lib/domain/pesquisa-precos/mapa-comparativo";
import { gerarMemoriaCalculo } from "@/lib/domain/pesquisa-precos/memoria-calculo";
import type { Cotacao } from "@/lib/domain/pesquisa-precos/types";
import { formatarData, formatarMoeda } from "@/lib/utils";
import { Breadcrumbs } from "@/components/breadcrumbs";
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
import { ExportarAcoes } from "@/components/exportar-acoes";

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
  const { id, itemId } = await params;
  const { item, processo } = await getItemDoUsuario(itemId);

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
      <Breadcrumbs
        className="print:hidden"
        items={[
          { label: processo.numeroProcesso, href: `/processos/${id}` },
          { label: item.descricao, href: `/processos/${id}/itens/${itemId}` },
          { label: "Mapa comparativo" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mapa comparativo de preços</h1>
          <p className="text-muted-foreground">{item.descricao}</p>
        </div>
        <ExportarAcoes
          nomeArquivo={`mapa-comparativo-${item.descricao}`}
          linhas={[
            ["Mapa comparativo de preços"],
            ["Item", item.descricao],
            ...(memoria
              ? [
                  ["Método aplicado", METODO_LABEL[memoria.metodo]],
                  ["Valor de referência", formatarMoeda(memoria.valorResultado)],
                  [
                    "Cotações consideradas",
                    `${memoria.totalCotacoesConsideradas} de ${memoria.totalCotacoesConsideradas + memoria.totalCotacoesExcluidas}`,
                  ],
                ]
              : [["Nenhum cálculo realizado ainda"]]),
            [],
            ["Série de preços coletados"],
            ["Fonte", "Valor", "Data", "Origem", "Situação"],
            ...mapa.linhas.map((linha) => [
              FONTE_LABEL[linha.fonte] ?? linha.fonte,
              formatarMoeda(linha.valorUnitario),
              formatarData(linha.dataCotacao),
              linha.fornecedorOuOrigem ?? "",
              linha.situacao === "excluida" ? "Excluída" : "Considerada",
            ]),
            ...(memoria
              ? [
                  [],
                  ["Memória de cálculo"],
                  ...memoria.textoFormatado.split("\n").map((linhaTexto) => [linhaTexto]),
                ]
              : []),
          ]}
        />
      </div>

      {memoria ? (
        <Alert>
          <AlertTitle>
            {METODO_LABEL[memoria.metodo]}: R$ {formatarMoeda(memoria.valorResultado)}
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
                  <TableCell>R$ {formatarMoeda(linha.valorUnitario)}</TableCell>
                  <TableCell>{formatarData(linha.dataCotacao)}</TableCell>
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
