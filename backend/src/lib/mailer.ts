import nodemailer from "nodemailer";
import { env, isProduction } from "../config/env.js";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const transport = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 8000,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

if (!transport)
  console.warn("SMTP_HOST não configurado: e-mails serão exibidos no console, não enviados.");

export async function sendMail(mail: Mail) {
  if (!transport) {
    // Mail bodies may carry secrets (reset links); never write them to production logs.
    if (isProduction) throw new Error("SMTP_HOST não configurado.");
    console.info(`[e-mail] Para: ${mail.to}\nAssunto: ${mail.subject}\n\n${mail.text}`);
    return;
  }
  await transport.sendMail({ from: env.MAIL_FROM, ...mail });
}
