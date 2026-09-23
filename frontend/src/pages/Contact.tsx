import { useApp } from "../state/AppContext";
import { Button, Card, Icon, PageHeader } from "../components/ui";
export function Contact() {
  const { openModal } = useApp();
  return (
    <>
      <PageHeader
        title="Fale com nossa equipe"
        subtitle="Estamos aqui para acolher você."
      />
      <div className="grid two">
        <Card className="stack">
          <span className="tile-icon">
            <Icon name="chat" />
          </span>
          <h2>Atendimento Online</h2>
          <p className="muted">
            Converse com nossa equipe diretamente pelo WhatsApp.
          </p>
          <p className="small muted">Contato da empresa a configurar.</p>
          <Button icon="chat" onClick={() => openModal("whatsapp")}>
            Chamar no WhatsApp
          </Button>
        </Card>
        <Card className="stack">
          <span className="tile-icon">
            <Icon name="pin" />
          </span>
          <h2>Atendimento Presencial</h2>
          <p className="muted">
            Agende uma avaliação individual com nossa equipe.
          </p>
          <p className="small muted">
            Endereço: a definir
            <br />
            Horário de demonstração: seg. a sex., 8h às 18h
            <br />
            Telefone: a configurar
          </p>
          <Button
            variant="outline"
            icon="calendar"
            onClick={() => openModal("schedule")}
          >
            Agendar atendimento
          </Button>
        </Card>
      </div>
      <div className="contact-map">
        <span>
          <Icon name="pin" />
          <br />
          Localização do espaço
          <br />
          <small>Mapa disponível após cadastro do endereço</small>
        </span>
      </div>
    </>
  );
}
