import { useEffect, useRef, useState, type FormEvent } from "react";
import { useApp } from "../state/AppContext";
import { Button, Field, Notice } from "./ui";
import { request } from "../services/api";
import { config } from "../config";
import type { ModalKind } from "../types";
const titles: Record<ModalKind, string> = {
  whatsapp: "Atendimento pelo WhatsApp",
  schedule: "Agendar atendimento",
  terms: "Termos de Uso",
  privacy: "Política de Privacidade",
  password: "Alterar senha",
  forgot: "Recuperar acesso",
  delete: "Excluir conta?",
  sample: "Um momento para você",
};
export function ModalHost() {
  const { modal, closeModal, reload, navigate, notify } = useApp();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (modal) ref.current?.showModal();
    else ref.current?.close();
  }, [modal]);
  const send = async (path: string, method: string, body?: unknown) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await request(path, method, body);
      closeModal();
      if (method === "DELETE") { await reload(); navigate("login"); }
      else notify(path === "/auth/forgot-password" ? "Se o e-mail estiver cadastrado, você receberá as instruções." : "Solicitação concluída.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível concluir."); }
    finally { pending.current = false; setBusy(false); }
  };
  const complete = (event: FormEvent<HTMLFormElement>, path: string) => {
    event.preventDefault();
    void send(path, "POST", Object.fromEntries(new FormData(event.currentTarget)));
  };
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return (
    <dialog
      ref={ref}
      onCancel={closeModal}
      onClose={closeModal}
      aria-labelledby="modal-title"
    >
      <div className="modal-head">
        <h2 id="modal-title">{modal ? titles[modal] : ""}</h2>
        <button className="close" onClick={closeModal} aria-label="Fechar">
          ×
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {modal === "whatsapp" && (
        <div className="stack">
          {config.whatsappNumber ? (
            <>
              <p className="muted">
                Converse com nossa equipe diretamente pelo WhatsApp.
              </p>
              <a
                className="btn"
                href={`https://wa.me/${config.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir conversa
              </a>
            </>
          ) : (
            <>
              <p className="muted">
                O número da empresa ainda não foi informado. O botão está
                preparado para receber o link oficial do WhatsApp.
              </p>

              <Button onClick={closeModal} full icon={false}>
                Entendi
              </Button>
            </>
          )}
        </div>
      )}
      {modal === "schedule" && (
        <form
          className="form"
          onSubmit={(event) => complete(event, "/appointments")}
        >
          <p className="small muted">Envie sua preferência de atendimento.</p>
          <Field label="Data desejada">
            <input name="date" type="date" min={minDate} required />
          </Field>
          <Field label="Horário">
            <input name="time" type="time" required />
          </Field>
          <Field label="Observações (opcional)">
            <textarea name="note" rows={2} />
          </Field>
          <Button type="submit" disabled={busy}>Solicitar agendamento</Button>
        </form>
      )}
      {(modal === "terms" || modal === "privacy") && (
        <div className="stack">
          <Notice>Documento ainda não disponibilizado. Entre em contato com a equipe para mais informações.</Notice>
        </div>
      )}
      {(modal === "password" || modal === "forgot") && (
        <form
          className="form"
          onSubmit={(event) =>
            complete(event, modal === "forgot" ? "/auth/forgot-password" : "/auth/change-password")
          }
        >
          {modal === "password" && <Field label="Senha atual"><input name="currentPassword" type="password" autoComplete="current-password" required /></Field>}
          <Field label={modal === "forgot" ? "E-mail" : "Nova senha"}>
            <input
              required
              name={modal === "forgot" ? "email" : "newPassword"}
              type={modal === "forgot" ? "email" : "password"}
              minLength={modal === "password" ? 6 : undefined}
            />
          </Field>
          <Button type="submit" disabled={busy}>Continuar</Button>
        </form>
      )}
      {modal === "delete" && (
        <div className="stack">
          <p className="muted">
            Confirme se deseja excluir sua conta. Esta ação será enviada ao servidor.
          </p>
          <div className="between">
            <Button variant="outline" icon={false} onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              icon={false}
              disabled={busy}
              onClick={() => void send("/me", "DELETE")}
            >
              Excluir e sair
            </Button>
          </div>
        </div>
      )}
      {modal === "sample" && (
        <div className="stack">
          <p className="muted">Exemplo de modal do Design System.</p>
          <Button onClick={closeModal}>Concluir</Button>
        </div>
      )}
    </dialog>
  );
}
