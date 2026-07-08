"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { adicionarCotacaoEncontrada } from "./actions";
import { MODALIDADES_CONTRATACAO } from "@/lib/integrations/pncp/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ResultadoPNCP {
  fonte: "pncp_api";
  valorUnitario: number;
  dataCotacao: string;
  fornecedorOuOrigem?: string;
  fonteDetalhe: {
    objetoCompra: string;
    numeroControlePNCP: string;
    unidadeOrgao?: { ufSigla?: string; municipioNome?: string };
  };
}

function hojeMenosDias(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data.toISOString().slice(0, 10);
}

export function BuscaPncp({ itemId }: { itemId: string }) {
  const [dataInicial, setDataInicial] = useState(hojeMenosDias(365));
  const [dataFinal, setDataFinal] = useState(hojeMenosDias(0));
  const [modalidade, setModalidade] = useState("6");
  const [resultados, setResultados] = useState<ResultadoPNCP[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [pending, startTransition] = useTransition();

  async function buscar() {
    setBuscando(true);
    setErro(null);
    try {
      const query = new URLSearchParams({
        dataInicial,
        dataFinal,
        codigoModalidadeContratacao: modalidade,
      });
      const resposta = await fetch(`/api/integrations/pncp?${query}`);
      const dados = await resposta.json();

      if (!dados.ok) {
        setErro(
          dados.error?.mensagem ??
            "Não foi possível consultar o PNCP no momento. Use a entrada manual.",
        );
        setResultados([]);
        return;
      }
      setResultados(dados.cotacoes);
    } catch {
      setErro(
        "Falha de conexão com o PNCP. Use a entrada manual como alternativa.",
      );
    } finally {
      setBuscando(false);
    }
  }

  function adicionar(resultado: ResultadoPNCP) {
    startTransition(async () => {
      const res = await adicionarCotacaoEncontrada(itemId, resultado);
      if (res.ok) {
        toast.success("Cotação adicionada a partir do PNCP.");
        setResultados((atuais) =>
          atuais.filter((r) => r.fonteDetalhe.numeroControlePNCP !== resultado.fonteDetalhe.numeroControlePNCP),
        );
      } else {
        toast.error(res.mensagem ?? "Não foi possível adicionar a cotação.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Fonte II (Art. 5º da IN 65/2021): contratações similares de outros
        órgãos via PNCP. O PNCP não permite busca por palavra-chave — revise o
        objeto de cada resultado para avaliar a relevância. O valor exibido é
        o valor total da contratação; ajuste-o se necessário antes de usar
        como cotação unitária.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="pncp-data-inicial">Data inicial</Label>
          <Input
            id="pncp-data-inicial"
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pncp-data-final">Data final</Label>
          <Input
            id="pncp-data-final"
            type="date"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value)}
          />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Modalidade</Label>
          <Select value={modalidade} onValueChange={(v) => v && setModalidade(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODALIDADES_CONTRATACAO).map(([codigo, nome]) => (
                <SelectItem key={codigo} value={codigo}>
                  {nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="button" onClick={buscar} disabled={buscando}>
        <Search className="size-4" />
        {buscando ? "Buscando..." : "Buscar no PNCP"}
      </Button>

      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      {resultados.length > 0 && (
        <ul className="space-y-2">
          {resultados.map((resultado) => (
            <li
              key={resultado.fonteDetalhe.numeroControlePNCP}
              className="flex items-start justify-between gap-4 rounded-md border p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  R$ {resultado.valorUnitario.toFixed(2)} —{" "}
                  {resultado.fornecedorOuOrigem}
                </p>
                <p className="text-muted-foreground">
                  {resultado.fonteDetalhe.objetoCompra}
                </p>
                <p className="text-xs text-muted-foreground">
                  {resultado.fonteDetalhe.unidadeOrgao?.municipioNome}/
                  {resultado.fonteDetalhe.unidadeOrgao?.ufSigla} —{" "}
                  {resultado.dataCotacao}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => adicionar(resultado)}
              >
                Adicionar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
