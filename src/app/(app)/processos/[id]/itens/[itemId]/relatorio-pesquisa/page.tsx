import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { getItemDoUsuario } from "@/lib/data/processos";
import { db } from "@/lib/db";
import { cotacoes } from "@/lib/db/schema";
import {
  calcularMaiorValor,
  calcularMedia,
  calcularMediana,
  calcularMenorValor,
} from "@/lib/domain/pesquisa-precos/estatistica";
import type { ItemPesquisaPrecoComprasGov } from "@/lib/integrations/comprasgov/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatarData, formatarMoeda, formatarQuantidade } from "@/lib/utils";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ExportarAcoes } from "@/components/exportar-acoes";

export const metadata: Metadata = { title: "Relatório de pesquisa" };

export default async function RelatorioPesquisaPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const { item, processo } = await getItemDoUsuario(itemId);

  const linhasCotacoes = await db
    .select()
    .from(cotacoes)
    .where(
      and(
        eq(cotacoes.itemId, itemId),
        eq(cotacoes.fonte, "painel_precos_api"),
      ),
    );

  const linhas = linhasCotacoes
    .filter((c) => !c.excluida)
    .map((c) => {
      const detalhe = c.fonteDetalhe as ItemPesquisaPrecoComprasGov | null;
      return {
        id: c.id,
        codigoItem:
          detalhe?.codigoItemCatalogo?.toString() ??
          item.catmatCatserCodigo ??
          "—",
        descricaoItem: detalhe?.descricaoItem ?? item.descricao,
        quantidade:
          detalhe?.quantidade != null
            ? formatarQuantidade(detalhe.quantidade)
            : "—",
        precoUnitario: Number(c.valorUnitario),
        codigoUasg: detalhe?.codigoUasg ?? "—",
        nomeUasg: detalhe?.nomeUasg ?? "—",
        dataCompra: formatarData(c.dataCotacao),
      };
    });

  const valores = linhas.map((l) => l.precoUnitario);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        className="print:hidden"
        items={[
          { label: processo.numeroProcesso, href: `/processos/${id}` },
          { label: item.descricao, href: `/processos/${id}/itens/${itemId}` },
          { label: "Relatório de pesquisa" },
        ]}
      />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Relatório de pesquisa de preços
          </h1>
          <p className="text-muted-foreground">
            {item.descricao} — fonte: Compras.gov.br (Art. 5º, I da IN
            SEGES/ME nº 65/2021)
          </p>
        </div>
        {linhas.length > 0 && (
          <ExportarAcoes
            nomeArquivo={`relatorio-pesquisa-${item.descricao}`}
            linhas={[
              ["Relatório de pesquisa de preços"],
              ["Item", item.descricao],
              [],
              [
                "Código",
                "Descrição",
                "Quantidade",
                "Preço Unitário",
                "UASG",
                "Nome da UASG",
                "Data da Compra",
              ],
              ...linhas.map((linha) => [
                linha.codigoItem,
                linha.descricaoItem,
                linha.quantidade,
                formatarMoeda(linha.precoUnitario),
                linha.codigoUasg,
                linha.nomeUasg,
                linha.dataCompra,
              ]),
              [],
              ["Dados estatísticos"],
              ["Preço Médio", formatarMoeda(calcularMedia(valores))],
              ["Mediana", formatarMoeda(calcularMediana(valores))],
              ["Maior Preço", formatarMoeda(calcularMaiorValor(valores))],
              ["Menor Preço", formatarMoeda(calcularMenorValor(valores))],
            ]}
          />
        )}
      </div>

      {linhas.length === 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Nenhuma cotação do Compras.gov.br registrada</AlertTitle>
          <AlertDescription>
            Adicione cotações pela busca do Compras.gov.br na página do item
            para gerar este relatório.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Itens pesquisados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Preço Unitário</TableHead>
                    <TableHead>UASG</TableHead>
                    <TableHead>Nome da UASG</TableHead>
                    <TableHead>Data da Compra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((linha) => (
                    <TableRow key={linha.id}>
                      <TableCell>{linha.codigoItem}</TableCell>
                      <TableCell>{linha.descricaoItem}</TableCell>
                      <TableCell>{linha.quantidade}</TableCell>
                      <TableCell>R$ {formatarMoeda(linha.precoUnitario)}</TableCell>
                      <TableCell>{linha.codigoUasg}</TableCell>
                      <TableCell>{linha.nomeUasg}</TableCell>
                      <TableCell>{linha.dataCompra}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados estatísticos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Preço Médio</p>
                <p className="text-lg font-medium">
                  R$ {formatarMoeda(calcularMedia(valores))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mediana</p>
                <p className="text-lg font-medium">
                  R$ {formatarMoeda(calcularMediana(valores))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maior Preço</p>
                <p className="text-lg font-medium">
                  R$ {formatarMoeda(calcularMaiorValor(valores))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Menor Preço</p>
                <p className="text-lg font-medium">
                  R$ {formatarMoeda(calcularMenorValor(valores))}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
