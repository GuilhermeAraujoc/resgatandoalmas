import { useEffect, useRef, useState, type FormEvent } from "react";
import { useApp } from "../state/AppContext";
import { Button, Field, Notice } from "./ui";
import { config } from "../config";
import type { ModalKind } from "../types";
import { errorMessage } from "../services/api";
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
  const { modal, closeModal, notify, deleteAccount } = useApp();
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (modal) ref.current?.showModal();
    else ref.current?.close();
  }, [modal]);
  const complete = (event: FormEvent<HTMLFormElement>, message: string) => {
    event.preventDefault();
    closeModal();
    notify(message);
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
              <Notice>Demonstração: nenhuma mensagem será enviada.</Notice>
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
          onSubmit={(event) =>
            complete(
              event,
              "Preferência registrada na demonstração. Nenhuma reserva foi realizada.",
            )
          }
        >
          <p className="small muted">
            Simule sua preferência de atendimento. Nenhuma reserva real será
            feita.
          </p>
          <Field label="Data desejada">
            <input type="date" min={minDate} required />
          </Field>
          <Field label="Horário">
            <select>
              {["08:00", "10:00", "14:00", "16:00"].map((time) => (
                <option key={time}>{time}</option>
              ))}
            </select>
          </Field>
          <Field label="Observações (opcional)">
            <textarea rows={2} />
          </Field>
          <Button type="submit">Simular agendamento</Button>
        </form>
      )}
      {(modal === "terms" || modal === "privacy") && (
        <div className="stack">
          <p className="muted">
            Este é um protótipo demonstrativo de bem-estar. Avaliações,
            resultados e protocolos são fictícios e não substituem cuidados
            profissionais de saúde.
          </p>
          <p className="muted">
            Seus dados de cadastro, avaliações e feedbacks são armazenados para
            acompanhar sua evolução. A senha é guardada apenas de forma
            protegida, e não há análise real por IA. O player incorporado é
            fornecido pelo YouTube e está sujeito às políticas desse serviço.
          </p>
          <Notice>
            Documento demonstrativo. Termos e política definitivos devem ser
            preparados antes do lançamento.
          </Notice>
        </div>
      )}
      {(modal === "password" || modal === "forgot") && (
        <form
          className="form"
          onSubmit={(event) =>
            complete(event, "Fluxo demonstrativo concluído.")
          }
        >
          <p className="muted small">
            Fluxo demonstrativo. Nenhum e-mail será enviado ou senha alterada.
          </p>
          <Field label={modal === "forgot" ? "E-mail" : "Nova senha"}>
            <input
              required
              type={modal === "forgot" ? "email" : "password"}
              minLength={modal === "password" ? 6 : undefined}
            />
          </Field>
          <Button type="submit">Continuar</Button>
        </form>
      )}
      {modal === "delete" && (
        <div className="stack">
          <p className="muted">
            Sua conta e todos os seus registros serão excluídos. Esta ação não
            pode ser desfeita.
          </p>
          <div className="between">
            <Button variant="outline" icon={false} onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              icon={false}
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                try {
                  await deleteAccount();
                  closeModal();
                  notify("Sua conta foi excluída.");
                } catch (error) {
                  notify(errorMessage(error));
                } finally {
                  setDeleting(false);
                }
              }}
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
