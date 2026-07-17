import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getItemDoUsuario } from "@/lib/data/processos";
import { db } from "@/lib/db";
import { cotacoes } from "@/lib/db/schema";
import { formatarQuantidade } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BuscaPncp } from "./busca-pncp";
import { BuscaComprasGov } from "./busca-comprasgov";
import { CotacaoManualForm } from "./cotacao-manual-form";
import { CotacoesTable } from "./cotacoes-table";
import { CalcularForm } from "./calcular-form";
import { SolicitarCotacaoForm } from "./solicitar-cotacao-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = { title: "Item" };

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const { item, processo } = await getItemDoUsuario(itemId);

  const cotacoesDoItem = await db
    .select()
    .from(cotacoes)
    .where(eq(cotacoes.itemId, itemId));

  const cotacoesParaTabela = cotacoesDoItem.map((c) => ({
    id: c.id,
    fonte: c.fonte,
    valorUnitario: c.valorUnitario,
    dataCotacao: c.dataCotacao,
    excluida: c.excluida,
    motivoExclusao: c.motivoExclusao,
    fornecedorOuOrigem: (c.fonteDetalhe as { fornecedorOuOrigem?: string } | null)
      ?.fornecedorOuOrigem,
  }));

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: processo.numeroProcesso, href: `/processos/${id}` },
          { label: item.descricao },
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{item.descricao}</h1>
          <p className="text-muted-foreground">
            {formatarQuantidade(item.quantidade)} {item.unidadeMedida}
            {item.catmatCatserCodigo && ` — CATMAT/CATSER ${item.catmatCatserCodigo}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            render={<Link href={`/processos/${id}/itens/${itemId}/relatorio-pesquisa`} />}
            nativeButton={false}
            variant="outline"
            size="sm"
          >
            Relatório de pesquisa
          </Button>
          <Button
            render={<Link href={`/processos/${id}/itens/${itemId}/mapa`} />}
            nativeButton={false}
            variant="outline"
            size="sm"
          >
            Ver mapa comparativo
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar preços</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="comprasgov">
            <TabsList>
              <TabsTrigger value="comprasgov">Compras.gov.br</TabsTrigger>
              <TabsTrigger value="pncp">PNCP</TabsTrigger>
              <TabsTrigger value="email">Solicitar por e-mail</TabsTrigger>
              <TabsTrigger value="manual">Entrada manual</TabsTrigger>
            </TabsList>
            <TabsContent value="comprasgov" className="pt-4">
              <BuscaComprasGov
                itemId={itemId}
                codigoItemCatalogoInicial={item.catmatCatserCodigo ?? undefined}
              />
            </TabsContent>
            <TabsContent value="pncp" className="pt-4">
              <BuscaPncp itemId={itemId} />
            </TabsContent>
            <TabsContent value="email" className="pt-4">
              <SolicitarCotacaoForm
                itemId={itemId}
                itemDescricao={item.descricao}
                codigoCatalogo={item.catmatCatserCodigo}
              />
            </TabsContent>
            <TabsContent value="manual" className="pt-4">
              <p className="mb-4 text-sm text-muted-foreground">
                Fontes III, IV e V da IN 65/2021 (mídia especializada,
                cotação direta com fornecedores, notas fiscais) — sem API
                pública disponível.
              </p>
              <CotacaoManualForm itemId={itemId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Cotações coletadas</h2>
        <CotacoesTable itemId={itemId} cotacoes={cotacoesParaTabela} />
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Calcular preço de referência</h2>
        <CalcularForm itemId={itemId} />
      </div>
    </div>
  );
}
