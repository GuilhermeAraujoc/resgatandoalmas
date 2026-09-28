import { env } from "../config/env.js";
import { sendMail } from "../lib/mailer.js";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export async function enviarEmailConfirmacao(
  email: string,
  nome: string,
  token: string
) {
  const url = new URL("/verificar-email", env.APP_URL);
  url.searchParams.set("token", token);
  const link = escapeHtml(url.toString());

  await sendMail({
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