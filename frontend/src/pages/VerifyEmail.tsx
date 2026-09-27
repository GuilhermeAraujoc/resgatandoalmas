import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Card, Field, Logo } from "../components/ui";
import { ApiError, errorMessage } from "../services/api";
import { resendConfirmation, verifyEmail } from "../services/auth";

export function ResendConfirmation({ initialEmail = "" }: { initialEmail?: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setPending(true);
    setMessage("");
    try { setMessage((await resendConfirmation(email)).message); }
    catch (error) { setMessage(errorMessage(error)); }
    finally { setPending(false); }
  }
  return <form className="form" onSubmit={submit}>
    <Field label="E-mail do cadastro"><input name="email" type="email" autoComplete="email" defaultValue={initialEmail} required /></Field>
    <Button type="submit" disabled={pending}>{pending ? "Enviando…" : "Reenviar e-mail de confirmação"}</Button>
    {message && <p role="status">{message}</p>}
  </form>;
}

export function VerifyEmail() {
  const token = new URLSearchParams(window.location.search).get("token");
  const [status, setStatus] = useState<"loading" | "success" | "expired" | "error">("loading");
  const [message, setMessage] = useState("");
  // Share the request across StrictMode's effect replay: tokens are single-use.
  const request = useRef<{ token: string | null; promise: ReturnType<typeof verifyEmail> } | null>(null);
  useEffect(() => {
    let active = true;
    if (!request.current || request.current.token !== token) {
      request.current = { token, promise: token ? verifyEmail(token) : Promise.reject(new ApiError(400, "Link de confirmação inválido.")) };
    }
    request.current.promise.then(result => {
      if (active) { setStatus("success"); setMessage(result.message); }
    }).catch(error => {
      if (active) {
        setStatus(error instanceof ApiError && error.status === 410 ? "expired" : "error");
        setMessage(errorMessage(error));
      }
    });
    return () => { active = false; };
  }, [token]);
  return <main className="narrow" style={{ marginTop: 70 }}>
    <Card className="center" style={{ padding: "50px 25px" }}>
      <Logo />
      <div role="status" aria-live="polite">
        <h1>{status === "loading" ? "Confirmando seu e-mail..." : status === "success" ? message : status === "expired" ? "Este link de confirmação expirou." : "Não foi possível confirmar seu e-mail."}</h1>
        {status === "success" && <p>Sua conta está pronta para ser utilizada.</p>}
        {status === "error" && <p>{message} Se você já confirmou seu e-mail, acesse sua conta.</p>}
      </div>
      {(status === "expired" || status === "error") && <ResendConfirmation />}
      {status !== "loading" && <a className="btn" href="/login">Entrar na plataforma</a>}
    </Card>
  </main>;
}
