import { useState, type FormEvent } from "react";
import { useApp } from "../state/AppContext";
import { Button, Card, Field, Icon, PageHeader } from "../components/ui";
import { errorMessage } from "../services/api";
import { formatCpf, formatPhone } from "../utils/format";
export function Profile() {
  const { state, notify, openModal, saveProfile, logout } = useApp();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const initials = state.profile.name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? "");
    const name = text("name").trim();
    if (!name) {
      setError("Informe seu nome.");
      return;
    }
    const cpf = text("cpf");
    setError("");
    setPending(true);
    try {
      await saveProfile({
        name,
        email: text("email"),
        // Unchanged CPF is not re-sent.
        cpf: cpf.replace(/\D/g, "") === state.profile.cpf ? "" : cpf,
        phone: text("phone"),
        birthDate: text("birth"),
      });
      notify("Alterações salvas.");
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setPending(false);
    }
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
              <Field label="CPF">
                <input
                  name="cpf"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  defaultValue={formatCpf(state.profile.cpf)}
                />
              </Field>
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
                defaultValue={formatPhone(state.profile.phone)}
                placeholder="(00) 00000-0000"
              />
            </Field>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <Button type="submit" icon="check" disabled={pending}>
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
            <a
              className="textlink"
              href="#login"
              onClick={(event) => {
                event.preventDefault();
                void logout();
              }}
            >
              Sair <Icon name="logout" />
            </a>
          </Card>
          <a className="textlink" href="#design">
            Explorar Design System <Icon name="arrow" />
          </a>
        </div>
      </div>
    </>
  );
}
