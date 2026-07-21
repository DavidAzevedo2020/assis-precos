import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** `quantidade` vem do banco como numeric(18,4) — ex: "1.0000". Remove os zeros à direita. */
export function formatarQuantidade(valor: string | number): string {
  return Number(valor).toString()
}

/**
 * Reformata uma data ISO (yyyy-mm-dd, ou um datetime ISO mais longo) para
 * dd/mm/yyyy. Faz isso manipulando a string, não `Date`, pra não sofrer o
 * problema clássico de fuso horário (`new Date("2026-07-14")` é meia-noite
 * UTC, que em fusos negativos vira o dia anterior ao formatar localmente).
 */
export function formatarData(dataIso: string): string {
  const [ano, mes, dia] = dataIso.slice(0, 10).split("-")
  return `${dia}/${mes}/${ano}`
}

/** Formata um valor no padrão monetário brasileiro — ex: 6793.84 -> "6.793,84". */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Aplica máscara de moeda brasileira a uma string digitada livremente,
 * tratando os dígitos como centavos — ex: "12345" -> "R$ 123,45".
 */
export function mascararMoeda(valorDigitado: string): string {
  const digitos = valorDigitado.replace(/\D/g, "")
  if (!digitos) return ""
  const centavos = Number(digitos) / 100
  return `R$ ${formatarMoeda(centavos)}`
}

/** Iniciais a partir de um nome — ex: "David Azevedo" -> "DA". */
export function formatarIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] ?? ""
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ""
  return (primeira + ultima).toUpperCase()
}
