function escaparCampoCsv(valor: string): string {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

const BOM_UTF8 = "﻿";

/** Sem o BOM UTF-8, o Excel abre acentos/cedilha corrompidos. */
export function gerarCsv(linhas: (string | number)[][]): string {
  const corpo = linhas
    .map((linha) => linha.map((campo) => escaparCampoCsv(String(campo))).join(","))
    .join("\n");
  return BOM_UTF8 + corpo;
}

export function baixarCsv(
  nomeArquivo: string,
  linhas: (string | number)[][],
): void {
  const conteudo = gerarCsv(linhas);
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${nomeArquivo}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
