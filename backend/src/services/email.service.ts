import nodemailer from "nodemailer";
import "../config/env.js";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  connectionTimeout: 4000,
  greetingTimeout: 4000,
  socketTimeout: 8000,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function enviarEmailConfirmacao(
  email: string,
  nome: string,
  token: string
) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.FRONTEND_URL)
    throw new Error("Configuração de e-mail incompleta.");
  const url = new URL("/verificar-email", process.env.FRONTEND_URL);
  url.searchParams.set("token", token);
  const link = escapeHtml(url.toString());

  await transporter.sendMail({
    from: `"Resgatando Almas" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Confirme seu endereço de e-mail",

    text: `Olá, ${nome}! Confirme seu e-mail no Resgatando Almas: ${url.toString()} Este link é válido por 1 hora. Caso não tenha realizado este cadastro, ignore esta mensagem.`,
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
        <body style="
          font-family: Arial, sans-serif;
          background: #f5f5f5;
          padding: 30px;
        ">

          <div style="
            max-width: 600px;
            margin: auto;
            background: white;
            padding: 30px;
            border-radius: 15px;
          ">

            <h1 style="color:#6d28d9;">
              Olá, ${escapeHtml(nome)}! 👋
            </h1>

            <p>
              Seu cadastro foi realizado com sucesso.
            </p>

            <p>
              Para ativar sua conta, confirme seu endereço de e-mail.
            </p>

            <a
              href="${link}"
              style="
                display:inline-block;
                background:#6d28d9;
                color:white;
                padding:14px 25px;
                text-decoration:none;
                border-radius:8px;
                margin-top:15px;
              "
            >
              Confirmar meu e-mail
            </a>

            <p style="margin-top:30px;color:#777;">
              Este link expira em 1 hora.
            </p>

            <p>Caso você não tenha realizado este cadastro, ignore esta mensagem.</p>
          </div>

        </body>
      </html>
    `,
  });
}