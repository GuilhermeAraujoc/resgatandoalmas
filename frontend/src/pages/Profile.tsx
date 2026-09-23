import { useState, type FormEvent } from "react";
import { useApp } from "../state/AppContext";
import { Button, Card, Field, Icon, PageHeader } from "../components/ui";
export function Profile() {
  const { state, saveProfile, busy, logout, openModal } = useApp();
  const [error, setError] = useState("");
  const initials = state.profile.name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) {
      setError("Informe seu nome.");
      return;
    }
    setError("");
    void saveProfile({
      name,
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      birth: String(data.get("birth") ?? ""),
    });
  };
  return (
    <>
      <PageHeader
        title="Meu Perfil"
        subtitle="Um espaço para cuidar das suas informações."
      />
      <div className="grid dashboard">
        <Card>
          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "center",
              marginBottom: 30,
            }}
          >
            <span
              className="avatar"
              style={{ width: 64, height: 64, fontSize: 22 }}
            >
              {initials}
            </span>
            <div>
              <h2>{state.profile.name}</h2>
              <p className="muted small">Minha conta</p>
            </div>
          </div>
          <form className="form" onSubmit={submit}>
            <Field label="Nome completo">
              <input name="name" required defaultValue={state.profile.name} />
            </Field>
            <div className="grid two">
              <Field label="Data de nascimento">
                <input
                  name="birth"
                  type="date"
                  defaultValue={state.profile.birth}
                />
              </Field>
            </div>
            <Field label="E-mail">
              <input
                name="email"
                type="email"
                required
                defaultValue={state.profile.email}
              />
            </Field>
            <Field label="Telefone">
              <input
                name="phone"
                type="tel"
                defaultValue={state.profile.phone}
                placeholder="(00) 00000-0000"
              />
            </Field>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <Button type="submit" icon="check" disabled={busy}>
              Salvar alterações
            </Button>
          </form>
        </Card>
        <div className="stack" style={{ alignContent: "start" }}>
          <Card className="stack">
            <h3>Segurança</h3>
            <Button
              variant="outline"
              icon="shield"
              onClick={() => openModal("password")}
            >
              Alterar senha
            </Button>
          </Card>
          <Card className="stack">
            <h3>Privacidade</h3>
            <button className="textlink" onClick={() => openModal("terms")}>
              Termos de Uso <Icon name="arrow" />
            </button>
            <button className="textlink" onClick={() => openModal("privacy")}>
              Política de Privacidade <Icon name="arrow" />
            </button>
            <Button
              variant="danger"
              icon={false}
              onClick={() => openModal("delete")}
            >
              Excluir conta
            </Button>
            <button className="textlink" disabled={busy} onClick={() => void logout()}>Sair <Icon name="logout" /></button>
          </Card>
          <a className="textlink" href="#design">
            Explorar Design System <Icon name="arrow" />
          </a>
        </div>
      </div>
    </>
  );
}
