"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { adicionarCotacaoEncontrada } from "./actions";
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
import { formatarData, formatarMoeda } from "@/lib/utils";

interface ResultadoComprasGov {
  fonte: "painel_precos_api";
  valorUnitario: number;
  dataCotacao: string;
  fornecedorOuOrigem?: string;
  fonteDetalhe: {
    descricaoItem: string;
    nomeOrgao?: string;
    estado?: string;
    idCompra: string;
    idItemCompra: string;
  };
}

export function BuscaComprasGov({
  itemId,
  codigoItemCatalogoInicial,
}: {
  itemId: string;
  codigoItemCatalogoInicial?: string;
}) {
  const [tipo, setTipo] = useState<"material" | "servico">("material");
  const [codigo, setCodigo] = useState(codigoItemCatalogoInicial ?? "");
  const [resultados, setResultados] = useState<ResultadoComprasGov[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [pending, startTransition] = useTransition();

  async function buscar() {
    if (!codigo.trim()) {
      setErro("Informe o código CATMAT/CATSER do item.");
      return;
    }

    setBuscando(true);
    setErro(null);
    try {
      const query = new URLSearchParams({
        tipo,
        codigoItemCatalogo: codigo.trim(),
      });
      const resposta = await fetch(`/api/integrations/comprasgov?${query}`);
      const dados = await resposta.json();

      if (!dados.ok) {
        setErro(
          dados.error?.mensagem ??
            "Não foi possível consultar o Compras.gov.br no momento. Use a entrada manual.",
        );
        setResultados([]);
        return;
      }
      setResultados(dados.cotacoes);
    } catch {
      setErro(
        "Falha de conexão com o Compras.gov.br. Use a entrada manual como alternativa.",
      );
    } finally {
      setBuscando(false);
    }
  }

  function adicionar(resultado: ResultadoComprasGov) {
    startTransition(async () => {
      const res = await adicionarCotacaoEncontrada(itemId, resultado);
      if (res.ok) {
        toast.success("Cotação adicionada a partir do Compras.gov.br.");
        setResultados((atuais) =>
          atuais.filter(
            (r) => r.fonteDetalhe.idItemCompra !== resultado.fonteDetalhe.idItemCompra,
          ),
        );
      } else {
        toast.error(res.mensagem ?? "Não foi possível adicionar a cotação.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Fonte I (Art. 5º da IN 65/2021): preços praticados em compras
        governamentais, via módulo de dados abertos do Compras.gov.br
        (substituto do Painel de Preços legado).
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={(v) => v && setTipo(v as typeof tipo)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="material">Material (CATMAT)</SelectItem>
              <SelectItem value="servico">Serviço (CATSER)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label htmlFor="codigo-catalogo">Código do item no catálogo</Label>
          <Input
            id="codigo-catalogo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ex: 274984"
          />
        </div>
      </div>
      <Button type="button" onClick={buscar} disabled={buscando}>
        <Search className="size-4" />
        {buscando ? "Buscando..." : "Buscar no Compras.gov.br"}
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
              key={resultado.fonteDetalhe.idItemCompra}
              className="flex items-start justify-between gap-4 rounded-md border p-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  R$ {formatarMoeda(resultado.valorUnitario)} —{" "}
                  {resultado.fornecedorOuOrigem}
                </p>
                <p className="text-muted-foreground">
                  {resultado.fonteDetalhe.descricaoItem}
                </p>
                <p className="text-xs text-muted-foreground">
                  {resultado.fonteDetalhe.nomeOrgao} —{" "}
                  {resultado.fonteDetalhe.estado} —{" "}
                  {formatarData(resultado.dataCotacao)}
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
