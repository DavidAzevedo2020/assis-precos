import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { db } from "@/lib/db";
import { processos } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Processos" };

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  em_pesquisa: "Em pesquisa",
  pesquisa_concluida: "Pesquisa concluída",
  documentos_gerados: "Documentos gerados",
  finalizado: "Finalizado",
};

export default async function DashboardPage() {
  const session = await verifySession();

  const meusProcessos = await db
    .select()
    .from(processos)
    .where(eq(processos.responsavelId, session.userId))
    .orderBy(desc(processos.updatedAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Processos</h1>
          <p className="text-muted-foreground">
            Pesquisas de preço e documentos de licitação em andamento.
          </p>
        </div>
        <Button render={<Link href="/processos/novo" />}>
          <Plus className="size-4" />
          Novo processo
        </Button>
      </div>

      {meusProcessos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum processo cadastrado ainda.{" "}
            <Link href="/processos/novo" className="underline underline-offset-4">
              Criar o primeiro
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meusProcessos.map((processo) => (
            <Link key={processo.id} href={`/processos/${processo.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      {processo.numeroProcesso}
                    </CardTitle>
                    <Badge variant="secondary">
                      {STATUS_LABEL[processo.status] ?? processo.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {processo.objeto}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
