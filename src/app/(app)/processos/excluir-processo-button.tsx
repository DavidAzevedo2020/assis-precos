"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { removerProcesso } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ExcluirProcessoButton({
  processoId,
  numeroProcesso,
}: {
  processoId: string;
  numeroProcesso: string;
}) {
  const [pending, startTransition] = useTransition();

  function excluir() {
    startTransition(async () => {
      const res = await removerProcesso(processoId);
      if (res.ok) {
        toast.success("Processo excluído.");
      } else {
        toast.error(res.mensagem ?? "Não foi possível excluir o processo.");
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        }
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Excluir processo</span>
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Excluir processo {numeroProcesso}?</DialogTitle>
          <DialogDescription>
            Essa ação remove o processo e tudo o que está vinculado a ele —
            itens, cotações, cálculos e documentos gerados. Não pode ser
            desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={excluir}
          >
            {pending ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
