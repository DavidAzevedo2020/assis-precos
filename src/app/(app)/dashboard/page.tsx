import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { FileStack, FolderOpen, Plus, TrendingUp } from "lucide-react";
import { verifySession } from "@/lib/dal";
import { db } from "@/lib/db";
import { processos } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExcluirProcessoButton } from "../processos/excluir-processo-button";

export const metadata: Metadata = { title: "Processos" };

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  em_pesquisa: "Em pesquisa",
  pesquisa_concluida: "Pesquisa concluída",
  documentos_gerados: "Documentos gerados",
  finalizado: "Finalizado",
};

const STATUS_STYLE: Record<string, { badge: string; borda: string }> = {
  rascunho: {
    badge:
      "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
    borda: "border-l-slate-400 dark:border-l-slate-500",
  },
  em_pesquisa: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    borda: "border-l-blue-500",
  },
  pesquisa_concluida: {
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    borda: "border-l-amber-500",
  },
  documentos_gerados: {
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    borda: "border-l-violet-500",
  },
  finalizado: {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    borda: "border-l-emerald-500",
  },
};

export default async function DashboardPage() {
  const session = await verifySession();

  const meusProcessos = await db
    .select()
    .from(processos)
    .where(eq(processos.responsavelId, session.userId))
    .orderBy(desc(processos.updatedAt));

  const total = meusProcessos.length;
  const finalizados = meusProcessos.filter(
    (p) => p.status === "finalizado",
  ).length;
  const emAndamento = total - finalizados;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Processos</h1>
          <p className="text-muted-foreground">
            Pesquisas de preço e documentos de licitação em andamento.
          </p>
        </div>
        <Button render={<Link href="/processos/novo" />} nativeButton={false}>
          <Plus className="size-4" />
          Novo processo
        </Button>
      </div>

      {total > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <FileStack className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold leading-none">{total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <span className="flex size-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <TrendingUp className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold leading-none">
                  {emAndamento}
                </p>
                <p className="text-sm text-muted-foreground">Em andamento</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <FolderOpen className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold leading-none">
                  {finalizados}
                </p>
                <p className="text-sm text-muted-foreground">Finalizados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {meusProcessos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center text-muted-foreground">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <FileStack className="size-6" />
            </span>
            <p>
              Nenhum processo cadastrado ainda.{" "}
              <Link
                href="/processos/novo"
                className="font-medium text-primary underline underline-offset-4"
              >
                Criar o primeiro
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meusProcessos.map((processo) => {
            const estilo = STATUS_STYLE[processo.status];
            return (
              <Link key={processo.id} href={`/processos/${processo.id}`}>
                <Card
                  className={cn(
                    "h-full border-l-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
                    estilo?.borda,
                  )}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">
                        {processo.numeroProcesso}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge className={estilo?.badge}>
                          {STATUS_LABEL[processo.status] ?? processo.status}
                        </Badge>
                        <ExcluirProcessoButton
                          processoId={processo.id}
                          numeroProcesso={processo.numeroProcesso}
                        />
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {processo.objeto}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
