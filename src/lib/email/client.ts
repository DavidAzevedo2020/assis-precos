import "server-only";
import nodemailer from "nodemailer";

export interface AnexoEmail {
  nomeArquivo: string;
  conteudo: Buffer;
}

export interface EnviarEmailParams {
  destinatarios: string[];
  assunto: string;
  mensagem: string;
  anexo?: AnexoEmail;
}

/**
 * SMTP autenticado — exige uma "senha de aplicativo" (não a senha normal da
 * conta). `SMTP_HOST`/`SMTP_PORT` são configuráveis porque já trocamos de
 * provedor uma vez (Office 365 institucional -> Gmail pessoal, depois que o
 * tenant do Office 365 recusou com "SmtpClientAuthenticationDisabled").
 * Padrão: Gmail.
 */
function criarTransportador() {
  const email = process.env.SMTP_EMAIL;
  const senha = process.env.SMTP_APP_PASSWORD;

  if (!email || !senha) {
    throw new Error(
      "SMTP_EMAIL e SMTP_APP_PASSWORD precisam estar configurados no .env.local.",
    );
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: email, pass: senha },
    // Sem isso, uma falha de conexão/autenticação pode ficar pendurada por
    // minutos em vez de falhar rápido (já vimos 6min na prática).
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

export async function enviarEmail(params: EnviarEmailParams): Promise<void> {
  const transportador = criarTransportador();

  await transportador.sendMail({
    from: process.env.SMTP_EMAIL,
    to: params.destinatarios,
    subject: params.assunto,
    text: params.mensagem,
    attachments: params.anexo
      ? [{ filename: params.anexo.nomeArquivo, content: params.anexo.conteudo }]
      : undefined,
  });
}
