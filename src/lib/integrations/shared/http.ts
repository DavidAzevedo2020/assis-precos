import "server-only";
import type { IntegrationError, IntegrationResult } from "./types";

interface FetchResilienteOptions {
  timeoutMs?: number;
  tentativas?: number;
}

/**
 * Cliente HTTP resiliente para consumir APIs públicas instáveis (PNCP,
 * Compras.gov.br). Nunca lança exceção — sempre retorna um IntegrationResult,
 * permitindo que a camada de UI degrade graciosamente (aviso + entrada manual)
 * em vez de quebrar o fluxo do usuário.
 */
export async function fetchResiliente<T>(
  url: string,
  options: FetchResilienteOptions = {},
): Promise<IntegrationResult<T>> {
  const { timeoutMs = 8000, tentativas = 2 } = options;

  let ultimoErro: IntegrationError = {
    tipo: "rede",
    mensagem: "Falha desconhecida ao consultar fonte externa.",
  };

  for (let tentativa = 0; tentativa <= tentativas; tentativa++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const erroHttp: IntegrationError = {
          tipo: "http",
          mensagem: `Fonte externa respondeu com status ${response.status}.`,
          statusCode: response.status,
        };

        // Só vale a pena tentar de novo em erro de servidor (5xx).
        if (response.status >= 500 && tentativa < tentativas) {
          ultimoErro = erroHttp;
          await aguardar(backoffMs(tentativa));
          continue;
        }
        return { ok: false, error: erroHttp };
      }

      const data = (await response.json()) as T;
      return { ok: true, data };
    } catch (erro) {
      clearTimeout(timeoutId);
      const isAbort = erro instanceof Error && erro.name === "AbortError";
      ultimoErro = isAbort
        ? {
            tipo: "timeout",
            mensagem: "Tempo de resposta excedido ao consultar fonte externa.",
          }
        : {
            tipo: "rede",
            mensagem: `Falha de rede ao consultar fonte externa: ${erro instanceof Error ? erro.message : String(erro)}`,
          };

      if (tentativa < tentativas) {
        await aguardar(backoffMs(tentativa));
        continue;
      }
    }
  }

  return { ok: false, error: ultimoErro };
}

function backoffMs(tentativa: number): number {
  return 300 * 2 ** tentativa;
}

function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
