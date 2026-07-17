"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ExternalLink, Search } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatarData, formatarMoeda } from "@/lib/utils";

interface ResultadoPNCP {
  fonte: "pncp_api";
  valorUnitario: number;
  dataCotacao: string;
  fornecedorOuOrigem?: string;
  fonteDetalhe: {
    objetoCompra: string;
    numeroControlePNCP: string;
    unidadeOrgao?: { ufSigla?: string; municipioNome?: string };
    /** Só vem preenchido na busca por palavra-chave (ver route.ts). */
    itemCatalogo?: { fonte: string; oficial: boolean; codigo: string | null } | null;
  };
}

type TipoDocumentoAtaOuContrato = "ata" | "contrato";

interface DocumentoAtaOuContratoPNCP {
  numeroControlePNCP: string;
  tipoDocumento: TipoDocumentoAtaOuContrato;
  titulo: string;
  descricao: string;
  orgaoNome: string;
  esferaNome?: string;
  municipioNome?: string;
  uf?: string;
  dataAssinatura?: string;
  dataFimVigencia?: string;
  valorGlobal: number | null;
  cancelado: boolean;
  url: string;
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
  const [palavraChave, setPalavraChave] = useState("");
  const [resultados, setResultados] = useState<ResultadoPNCP[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [pending, startTransition] = useTransition();

  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoAtaOuContrato>("ata");
  const [palavraChaveAtaContrato, setPalavraChaveAtaContrato] = useState("");
  const [documentos, setDocumentos] = useState<DocumentoAtaOuContratoPNCP[]>([]);
  const [erroAtaContrato, setErroAtaContrato] = useState<string | null>(null);
  const [buscandoAtaContrato, setBuscandoAtaContrato] = useState(false);

  async function executarBusca(query: URLSearchParams) {
    setBuscando(true);
    setErro(null);
    try {
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

  function buscarPorPeriodo() {
    return executarBusca(
      new URLSearchParams({
        dataInicial,
        dataFinal,
        codigoModalidadeContratacao: modalidade,
      }),
    );
  }

  function buscarPorPalavraChave() {
    if (!palavraChave.trim()) {
      setErro("Informe uma palavra-chave para buscar.");
      return;
    }
    return executarBusca(new URLSearchParams({ q: palavraChave.trim() }));
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

  async function buscarAtaOuContrato() {
    if (!palavraChaveAtaContrato.trim()) {
      setErroAtaContrato("Informe uma palavra-chave para buscar.");
      return;
    }
    setBuscandoAtaContrato(true);
    setErroAtaContrato(null);
    try {
      const query = new URLSearchParams({
        q: palavraChaveAtaContrato.trim(),
        tipoDocumento,
      });
      const resposta = await fetch(`/api/integrations/pncp?${query}`);
      const dados = await resposta.json();

      if (!dados.ok) {
        setErroAtaContrato(
          dados.error?.mensagem ??
            "Não foi possível consultar o PNCP no momento. Tente novamente em instantes.",
        );
        setDocumentos([]);
        return;
      }
      setDocumentos(dados.documentos);
    } catch {
      setErroAtaContrato("Falha de conexão com o PNCP.");
    } finally {
      setBuscandoAtaContrato(false);
    }
  }

  function adicionarDocumento(documento: DocumentoAtaOuContratoPNCP) {
    if (documento.valorGlobal === null) return;

    startTransition(async () => {
      const res = await adicionarCotacaoEncontrada(itemId, {
        fonte: "pncp_api",
        valorUnitario: documento.valorGlobal,
        dataCotacao: (documento.dataAssinatura ?? new Date().toISOString()).slice(0, 10),
        fornecedorOuOrigem: documento.orgaoNome,
        fonteDetalhe: documento,
      });
      if (res.ok) {
        toast.success("Cotação adicionada a partir do PNCP.");
        setDocumentos((atuais) =>
          atuais.filter((d) => d.numeroControlePNCP !== documento.numeroControlePNCP),
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
        órgãos via PNCP. O valor exibido é o valor total da contratação;
        ajuste-o se necessário antes de usar como cotação unitária.
      </p>

      <Tabs defaultValue="palavra-chave">
        <TabsList>
          <TabsTrigger value="palavra-chave">Por palavra-chave</TabsTrigger>
          <TabsTrigger value="periodo">Por período/modalidade</TabsTrigger>
          <TabsTrigger value="ata-contrato">Atas e contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="palavra-chave" className="space-y-3 pt-3">
          <p className="text-xs text-muted-foreground">
            Busca por relevância textual (ex: &quot;seguro automotivo&quot;).
            Usa um endpoint do PNCP não coberto pelo Manual de Integração
            oficial — se parar de funcionar, use a busca por período/modalidade
            ou a entrada manual.
          </p>
          <div className="space-y-1">
            <Label htmlFor="pncp-palavra-chave">Palavra-chave</Label>
            <Input
              id="pncp-palavra-chave"
              value={palavraChave}
              onChange={(e) => setPalavraChave(e.target.value)}
              placeholder="Ex: seguro automotivo"
            />
          </div>
          <Button type="button" onClick={buscarPorPalavraChave} disabled={buscando}>
            <Search className="size-4" />
            {buscando ? "Buscando..." : "Buscar no PNCP"}
          </Button>
        </TabsContent>

        <TabsContent value="periodo" className="space-y-3 pt-3">
          <p className="text-xs text-muted-foreground">
            O PNCP não permite busca por palavra-chave nesta modalidade de
            consulta — revise o objeto de cada resultado para avaliar a
            relevância.
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
          <Button type="button" onClick={buscarPorPeriodo} disabled={buscando}>
            <Search className="size-4" />
            {buscando ? "Buscando..." : "Buscar no PNCP"}
          </Button>
        </TabsContent>

        <TabsContent value="ata-contrato" className="space-y-3 pt-3">
          <p className="text-xs text-muted-foreground">
            Varredura de atas de registro de preços e contratos publicados no
            PNCP por palavra-chave (ex: &quot;voadeira&quot;, &quot;embarcação&quot;).
            Útil para levantar referências antes de definir a especificação do
            item. Atas geralmente não têm valor global (é um registro de
            preços, não uma contratação com valor único) — nesse caso, abra o
            link para ver os itens e valores unitários.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2 space-y-1">
              <Label>Tipo de documento</Label>
              <Select
                value={tipoDocumento}
                onValueChange={(v) => v && setTipoDocumento(v as TipoDocumentoAtaOuContrato)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ata">Ata de registro de preços</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="pncp-ata-contrato-palavra-chave">Palavra-chave</Label>
              <Input
                id="pncp-ata-contrato-palavra-chave"
                value={palavraChaveAtaContrato}
                onChange={(e) => setPalavraChaveAtaContrato(e.target.value)}
                placeholder="Ex: voadeira"
              />
            </div>
          </div>
          <Button type="button" onClick={buscarAtaOuContrato} disabled={buscandoAtaContrato}>
            <Search className="size-4" />
            {buscandoAtaContrato ? "Buscando..." : "Buscar no PNCP"}
          </Button>

          {erroAtaContrato && (
            <Alert variant="destructive">
              <AlertDescription>{erroAtaContrato}</AlertDescription>
            </Alert>
          )}

          {documentos.length > 0 && (
            <ul className="space-y-2">
              {documentos.map((documento) => (
                <li
                  key={documento.numeroControlePNCP}
                  className="flex items-start justify-between gap-4 rounded-md border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {documento.valorGlobal !== null
                        ? `R$ ${formatarMoeda(documento.valorGlobal)} — `
                        : ""}
                      {documento.orgaoNome}
                    </p>
                    <p className="text-muted-foreground">{documento.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {documento.municipioNome}/{documento.uf}
                      {documento.dataAssinatura && ` — ${formatarData(documento.dataAssinatura)}`}
                      {documento.cancelado && " — CANCELADO"}
                    </p>
                    <a
                      href={documento.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline"
                    >
                      Ver no PNCP <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending || documento.valorGlobal === null}
                    title={
                      documento.valorGlobal === null
                        ? "Ata sem valor global — confira os itens no link do PNCP"
                        : undefined
                    }
                    onClick={() => adicionarDocumento(documento)}
                  >
                    Adicionar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

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
                  R$ {formatarMoeda(resultado.valorUnitario)} —{" "}
                  {resultado.fornecedorOuOrigem}
                </p>
                <p className="text-muted-foreground">
                  {resultado.fonteDetalhe.objetoCompra}
                </p>
                <p className="text-xs text-muted-foreground">
                  {resultado.fonteDetalhe.unidadeOrgao?.municipioNome}/
                  {resultado.fonteDetalhe.unidadeOrgao?.ufSigla} —{" "}
                  {formatarData(resultado.dataCotacao)}
                </p>
                {resultado.fonteDetalhe.itemCatalogo && (
                  <Badge
                    variant={
                      resultado.fonteDetalhe.itemCatalogo.oficial
                        ? "secondary"
                        : "outline"
                    }
                    className="mt-1"
                  >
                    {resultado.fonteDetalhe.itemCatalogo.oficial
                      ? `CATMAT/CATSER ${resultado.fonteDetalhe.itemCatalogo.codigo}`
                      : `Catálogo próprio do órgão (não é CATMAT/CATSER)`}
                  </Badge>
                )}
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
