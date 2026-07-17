"use client";

import { ChevronDown, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { baixarCsv } from "@/lib/csv";

export function ExportarAcoes({
  nomeArquivo,
  linhas,
}: {
  nomeArquivo: string;
  /** Cada item é uma linha do CSV — inclua títulos/cabeçalhos de seção como linhas normais. */
  linhas: (string | number)[][];
}) {
  return (
    <div className="print:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button type="button" variant="outline" size="sm" />}>
          <FileText className="size-4" />
          Gerar Relatório
          <ChevronDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => window.print()}>
            <Printer className="size-4" />
            Exportar PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => baixarCsv(nomeArquivo, linhas)}>
            <FileSpreadsheet className="size-4" />
            Exportar Excel (CSV)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
