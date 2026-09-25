import { useApp } from "../state/AppContext";
import { energyLabel, protocolItems } from "../state/model";
import {
  Badge,
  Button,
  Card,
  EnergyChart,
  EnergyLevelIndicator,
  ExerciseArt,
  Icon,
  PageHeader,
  ProgressBar,
} from "../components/ui";
export function Home() {
  const { state, navigate, startExercise } = useApp();
  const protocol = protocolItems(state.scenario, state.protocolCatalog ?? state.catalog);
  const done = protocol.filter((e) => state.completed.includes(e.id)).length;
  const next =
    protocol.find((e) => !state.completed.includes(e.id)) ?? protocol[0];
  const activeDays = state.summary.activeDaysThisWeek;
  const activeCount = activeDays.filter(Boolean).length;
  const todayIndex = (new Date().getDay() + 6) % 7;
  const protocolInfo = state.scenario ? (state.protocolCatalog ?? state.catalog)?.protocols[state.scenario] : null;
  const date = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return (
    <>
      <PageHeader
        title={
          <>
            Olá, {state.profile.name.split(" ")[0]}{" "}
            <span style={{ fontSize: 25 }}>☀</span>
          </>
        }
        subtitle="Como você está se sentindo hoje?"
        extra={
          <span className="date">
            <Icon name="calendar" />
            {date}
          </span>
        }
      />
      <div className="grid dashboard">
        <Card
          className="hover-glow"
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            event.currentTarget.style.setProperty(
              "--mx",
              `${event.clientX - rect.left}px`,
            );
            event.currentTarget.style.setProperty(
              "--my",
              `${event.clientY - rect.top}px`,
            );
          }}
        >
          <div className="cardhead">
            <h3>Seu nível de energia</h3>
            <Badge>
              <Icon name="spark" />
              Último registro
            </Badge>
          </div>
          <span className="eyebrow">Nível atual</span>
          <div className="energy-title">
            <strong>{energyLabel(state.energy)}</strong>
            <span>Seu momento</span>
          </div>
          <EnergyLevelIndicator value={state.energy} />
          <p className="energy-note">
            <Icon name="chart" />
            Observe como seu nível energético varia ao longo da semana.
          </p>
          <EnergyChart records={state.history} />
        </Card>
        {protocol.length > 0 ? <Card className="protocol-feature">
          <div className="cardhead">
            <h3>Seu protocolo atual</h3>
            <Badge>{protocol.length > 0 && done === protocol.length ? "Concluído" : "Em andamento"}</Badge>
          </div>
          <div className="protocol-symbol">
            <Icon name="flower" />
          </div>
          <span className="eyebrow">Cuidado personalizado</span>
          <h2 style={{ marginTop: 9 }}>
            {protocolInfo?.name}
          </h2>
          <p>{protocolInfo?.description}</p>
          <div className="between progress-text">
            <span>{done} de {protocol.length} atividades concluídas</span>
            <span>{Math.round(protocol.length ? (done / protocol.length) * 100 : 0)}%</span>
          </div>
          <ProgressBar value={protocol.length ? (done / protocol.length) * 100 : 0} label="Atividades concluídas" />
          <Button full onClick={() => navigate("protocol")}>
            Continuar protocolo
          </Button>
        </Card>
        : <Card><h3>Seu protocolo</h3><p>Nenhum protocolo disponível ainda.</p><Button onClick={() => navigate("assessment")}>Fazer avaliação</Button></Card>}
      </div>
      <h2 className="section-label">Continue cuidando de você</h2>
      <div className="grid quickgrid">
        {next && <Card className="exercise-preview">
          <ExerciseArt icon={next.icon} color={next.art} />
          <div>
            <span className="eyebrow">Próximo exercício</span>
            <h3 style={{ marginTop: 9 }}>{next.name}</h3>
            <p className="meta">
              <Icon name="clock" /> {next.time} minutos · Iniciante
            </p>
            <button className="textlink" onClick={() => startExercise(next.id)}>
              Começar exercício <Icon name="arrow" />
            </button>
          </div>
        </Card>
        }
        <Card className="assessment-card">
          <div className="between">
            <h3>Avaliação energética</h3>
            <span className="tile-icon">
              <Icon name="clipboard" />
            </span>
          </div>
          <p>
            Sua avaliação ajuda a acompanhar seu momento.
            <br />
            Vamos observar como você está hoje?
          </p>
          <a className="textlink" href="/assessment">
            Refazer avaliação <Icon name="arrow" />
          </a>
        </Card>
      </div>

      <Card className="weekly">
        <div className="tile-icon">
          <Icon name="sun" />
        </div>
        <div>
          <h3>Pequenos passos, grandes mudanças.</h3>
          <p>
            {activeCount === 0
              ? "Reserve um momento para si nesta semana."
              : `Você reservou um momento para si em ${activeCount} ${activeCount === 1 ? "dia" : "dias"} desta semana.`}
          </p>
        </div>
        <div className="days">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => (
            <span
              key={index}
              className={`day ${index > todayIndex ? "future" : ""}`}
            >
              <span>{day}</span>
              <b>{activeDays[index] ? "✓" : "·"}</b>
            </span>
          ))}
        </div>
      </Card>
    </>
  );
}
