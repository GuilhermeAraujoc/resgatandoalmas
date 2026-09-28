import { useEffect, useState, type FormEvent } from "react";
import { useApp } from "../state/AppContext";
import { Button, Card, Field, Icon, Logo, PasswordInput } from "../components/ui";
import { ApiError, errorMessage } from "../services/api";
import { ResendConfirmation } from "./VerifyEmail";
function AuthSide() {
  return (
    <section className="auth-side">
      <Logo />
      <div className="quote">
        <small>UM ENCONTRO COM VOCÊ</small>
        <h1>Seu equilíbrio começa com um pequeno cuidado.</h1>
        <p>
          Um espaço para escutar seu corpo, acolher seu momento e encontrar o
          seu ritmo.
        </p>
        <div className="rings">
          <Icon name="flower" />
        </div>
      </div>
      <small>SEU TEMPO. SEU RITMO. SEU EQUILÍBRIO.</small>
    </section>
  );
}
export function Auth({ signup = false }: { signup?: boolean }) {
  const { login, register, navigate, openModal } = useApp();
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [registeredMessage, setRegisteredMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? "");
    if (signup && text("password") !== text("confirm")) {
      setError("As senhas não coincidem. Confira e tente novamente.");
      return;
    }
    if (signup && !text("name").trim()) {
      setError("Informe seu nome.");
      return;
    }
    setError("");
    setConfirmationEmail("");
    setPending(true);
    try {
      if (signup) {
        const result = await register({
          name: text("name").trim(),
          email: text("email"),
          password: text("password"),
          acceptedTerms: data.get("terms") === "on",
        });
        setRegisteredMessage(result.message);
        setConfirmationEmail(text("email"));
      } else {
        const user = await login({
          email: text("email"),
          password: text("password"),
          remember: data.get("remember") === "on",
        });
        navigate(user.role === "ADMIN" ? "admin" : "welcome");
        return;
      }

    } catch (failure) {
      setError(errorMessage(failure));
      if (failure instanceof ApiError && failure.code === "EMAIL_NOT_VERIFIED") setConfirmationEmail(text("email"));
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="auth">
      <AuthSide />
      <section className="auth-form">
        <div>
          <span className="demo">PROTÓTIPO · DADOS FICTÍCIOS</span>
          <h1 style={{ marginTop: 24 }}>
            {signup ? "Comece sua jornada" : "Bem-vindo novamente"}
          </h1>
          <p className="welcome-text">
            {signup
              ? "Um primeiro passo para cuidar de você."
              : "Entre na sua conta para continuar seu acompanhamento."}
          </p>
          {registeredMessage ? <div role="status"><p>{registeredMessage}</p><p>Verifique também a pasta de spam. O link é válido por 1 hora.</p><a className="btn" href="/login">Entrar na plataforma</a></div> : <form className="form" onSubmit={submit}>
            {signup && (
              <Field label="Nome completo">
                  <input
                    name="name"
                    placeholder="Como podemos chamar você?"
                    autoComplete="name"
                    required
                  />
              </Field>
            )}
            <Field label="E-mail">
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                required
              />
            </Field>
            <Field label="Senha">
              <PasswordInput
                name="password"
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={6}
                placeholder="Mínimo de 6 caracteres"
                required
              />
            </Field>
            {signup ? (
              <>
                <Field label="Confirmar senha">
                  <PasswordInput
                    name="confirm"
                    autoComplete="new-password"
                    minLength={6}
                    placeholder="Repita sua senha"
                    required
                  />
                </Field>
                <label className="check">
                  <input name="terms" type="checkbox" required />
                  Li e concordo com os Termos de Uso e Política de Privacidade.
                </label>
                <div className="legal-links">
                  <button type="button" onClick={() => openModal("terms")}>
                    Termos de Uso
                  </button>
                  <button type="button" onClick={() => openModal("privacy")}>
                    Política de Privacidade
                  </button>
                </div>
              </>
            ) : (
              <div className="between">
                <label className="check">
                  <input name="remember" type="checkbox" />
                  Lembrar de mim
                </label>
                <button
                  type="button"
                  className="textlink"
                  onClick={() => openModal("forgot")}
                >
                  Esqueci minha senha
                </button>
              </div>
            )}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <Button type="submit" full disabled={pending}>
              {signup ? "Criar minha conta" : "Entrar"}
            </Button>
          </form>}
          {confirmationEmail && <><p>Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada ou solicite um novo link.</p><ResendConfirmation initialEmail={confirmationEmail} /></>}
          <div className="auth-links">
            {signup ? "Já possui uma conta?" : "Ainda não possui uma conta?"}
            <a href={signup ? "/login" : "/signup"}>
              {signup ? "Entrar" : "Criar conta"}
            </a>
          </div>
          <p className="footer-note">
            Sua senha é armazenada de forma protegida.
            <br />
            Nunca a compartilhe com outras pessoas.
          </p>
        </div>
      </section>
    </div>
  );
}
/** Target of the e-mailed link: /reset-password?token=… */
export function ResetPassword() {
  const { resetPassword, navigate, notify, openModal } = useApp();
  const [token] = useState(
    () => new URLSearchParams(window.location.search).get("token") ?? "",
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  // Keep the single-use token out of the address bar and browser history.
  useEffect(() => {
    if (window.location.search)
      window.history.replaceState(null, "", window.location.pathname);
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (password !== String(data.get("confirm") ?? "")) {
      setError("As senhas não coincidem. Confira e tente novamente.");
      return;
    }
    setError("");
    setPending(true);
    try {
      await resetPassword(token, password);
      notify("Senha redefinida! Entre com sua nova senha.");
      navigate("login");
    } catch (failure) {
      setError(errorMessage(failure));
      setPending(false);
    }
  };
  return (
    <div className="auth">
      <AuthSide />
      <section className="auth-form">
        <div>
          <h1>Criar nova senha</h1>
          {token ? (
            <>
              <p className="welcome-text">
                Escolha uma nova senha para acessar sua conta. Por segurança,
                você sairá de todos os dispositivos conectados.
              </p>
              <form className="form" onSubmit={submit}>
                <Field label="Nova senha">
                  <PasswordInput
                    name="password"
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={72}
                    placeholder="Mínimo de 6 caracteres"
                    required
                  />
                </Field>
                <Field label="Confirmar nova senha">
                  <PasswordInput
                    name="confirm"
                    autoComplete="new-password"
                    minLength={6}
                    maxLength={72}
                    placeholder="Repita sua nova senha"
                    required
                  />
                </Field>
                {error && (
                  <p role="alert" className="form-error">
                    {error}
                  </p>
                )}
                <Button type="submit" full disabled={pending}>
                  Salvar nova senha
                </Button>
              </form>
            </>
          ) : (
            <>
              <p className="welcome-text">
                Este link de redefinição é inválido ou está incompleto.
              </p>
              <Button full onClick={() => openModal("forgot")}>
                Solicitar novo link
              </Button>
            </>
          )}
          <div className="auth-links">
            Lembrou sua senha?
            <a href="/login">Entrar</a>
          </div>
        </div>
      </section>
    </div>
  );
}
export function Welcome() {
  const { state, navigate } = useApp();
  return (
    <Card
      className="narrow center"
      style={{ marginTop: 70, padding: "50px 25px" }}
    >
      <div className="intro-icon">
        <Icon name="flower" />
      </div>
      <h1>Olá, {state.profile.name.split(" ")[0]} 👋</h1>
      <p className="muted" style={{ margin: "22px auto 32px", maxWidth: 400 }}>
        Vamos conhecer um pouco melhor como está sua energia hoje?
      </p>
      <Button onClick={() => navigate("assessment")}>
        Começar minha avaliação
      </Button>
      <p className="footer-note">
        Reserve alguns minutos para este encontro com você.
      </p>
    </Card>
  );
}
