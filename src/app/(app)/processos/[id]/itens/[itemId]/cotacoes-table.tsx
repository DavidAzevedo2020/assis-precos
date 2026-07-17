"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  atualizarExclusaoCotacao,
  removerCotacao,
} from "./actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatarData, formatarMoeda } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const FONTE_LABEL: Record<string, string> = {
  painel_precos_api: "Compras.gov.br (I)",
  pncp_api: "PNCP (II)",
  midia_especializada: "Mídia especializada (III)",
  pesquisa_direta: "Pesquisa direta (IV)",
  nota_fiscal: "Nota fiscal (V)",
};

export interface CotacaoLinha {
  id: string;
  fonte: string;
  valorUnitario: string;
  dataCotacao: string;
  excluida: boolean;
  motivoExclusao: string | null;
  fornecedorOuOrigem?: string;
}

export function CotacoesTable({
  itemId,
  cotacoes,
}: {
  itemId: string;
  cotacoes: CotacaoLinha[];
}) {
  const [dialogAberto, setDialogAberto] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [pending, startTransition] = useTransition();

  function confirmarExclusao() {
    if (!dialogAberto) return;
    if (!motivo.trim()) {
      toast.error("Informe o motivo da exclusão.");
      return;
    }
    startTransition(async () => {
      await atualizarExclusaoCotacao(itemId, dialogAberto, true, motivo.trim());
      setDialogAberto(null);
      setMotivo("");
    });
  }

  function reincluir(cotacaoId: string) {
    startTransition(async () => {
      await atualizarExclusaoCotacao(itemId, cotacaoId, false, "");
    });
  }

  function remover(cotacaoId: string) {
    startTransition(async () => {
      await removerCotacao(itemId, cotacaoId);
    });
  }

  if (cotacoes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma cotação registrada ainda.
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fonte</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cotacoes.map((cotacao) => (
            <TableRow key={cotacao.id}>
              <TableCell>{FONTE_LABEL[cotacao.fonte] ?? cotacao.fonte}</TableCell>
              <TableCell>R$ {formatarMoeda(Number(cotacao.valorUnitario))}</TableCell>
              <TableCell>{formatarData(cotacao.dataCotacao)}</TableCell>
              <TableCell>{cotacao.fornecedorOuOrigem ?? "—"}</TableCell>
              <TableCell>
                {cotacao.excluida ? (
                  <Badge variant="destructive" title={cotacao.motivoExclusao ?? ""}>
                    Excluída
                  </Badge>
                ) : (
                  <Badge variant="secondary">Considerada</Badge>
                )}
              </TableCell>
              <TableCell className="flex justify-end gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={cotacao.excluida}
                    disabled={pending}
                    onCheckedChange={(marcado) => {
                      if (marcado) setDialogAberto(cotacao.id);
                      else reincluir(cotacao.id);
                    }}
                  />
                  <span className="text-xs text-muted-foreground">excluir</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={pending}
                  onClick={() => remover(cotacao.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogAberto !== null} onOpenChange={(open) => !open && setDialogAberto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo da exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            O Art. 6º da IN 65/2021 exige critério fundamentado para excluir um
            preço da série (inexequível, inconsistente ou excessivamente
            elevado).
          </p>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: valor muito abaixo dos demais, indicando possível erro de digitação."
            rows={3}
          />
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              }
            />
            <Button type="button" onClick={confirmarExclusao} disabled={pending}>
              Confirmar exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
