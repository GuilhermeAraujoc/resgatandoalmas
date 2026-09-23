import { useApp } from "../state/AppContext";
import { energyLabel } from "../state/model";
import {
  Badge,
  Button,
  Card,
  EnergyChart,
  EnergyLevelIndicator,
  PageHeader,
  ProgressBar,
} from "../components/ui";
export function Progress() {
  const { state, navigate } = useApp();
  const assessments = state.history.filter(
    (record) => record.kind === "assessment",
  );
  const { summary } = state;
  const stats = [
    ["Energia atual", energyLabel(state.energy), "Seu último registro"],
    ["Evolução", "Em acompanhamento", "Observe como você se sente"],
    [
      "Exercícios realizados",
      String(summary.totalCompleted),
      "Momentos de autocuidado",
    ],
    [
      "Sequência",
      `${summary.streakDays} ${summary.streakDays === 1 ? "dia" : "dias"}`,
      "Um passo de cada vez",
    ],
  ];
  const weekGoal = 7;
  return (
    <>
      <PageHeader
        title="Meu Progresso"
        subtitle="Cada pequeno cuidado faz parte da sua jornada."
      />
      <div className="grid four">
        {stats.map(([title, value, detail]) => (
          <Card className="stat" key={title}>
            <span className="eyebrow">{title}</span>
            <strong>{value}</strong>
            <p>{detail}</p>
          </Card>
        ))}
      </div>
      <Card style={{ marginTop: 22 }}>
        <div className="cardhead">
          <h2>Evolução do nível de energia</h2>
          <Badge>Últimos registros</Badge>
        </div>
        <EnergyChart records={state.history} />
        <p className="small muted">
          Eixo horizontal: dias da semana. Eixo vertical: índice ilustrativo de
          0 a 100, organizado a partir dos relatos de bem-estar. Não representa
          uma medida clínica.
        </p>
        <div style={{ marginTop: 20 }}>
          <EnergyLevelIndicator value={state.energy} />
        </div>
      </Card>
      <div className="grid two" style={{ marginTop: 22 }}>
        <Card>
          <h3>Histórico de avaliações</h3>
          {assessments.length === 0 && (
            <p className="muted small" style={{ marginTop: 18 }}>
              Nenhuma avaliação registrada ainda.
            </p>
          )}
          <div className="timeline" style={{ marginTop: 25 }}>
            {[...assessments].reverse().map((record) => (
              <div key={record.id}>
                <span className="dot" />
                <div>
                  <h3 style={{ fontSize: 14 }}>
                    {new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "long",
                    }).format(new Date(record.date))}
                  </h3>
                  <p>Energia {energyLabel(record.value).toLowerCase()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3>Exercícios concluídos esta semana</h3>
          <strong
            style={{
              font: "700 36px Manrope",
              display: "block",
              margin: "25px 0",
            }}
          >
            {summary.completedThisWeek}{" "}
            <span className="muted" style={{ fontSize: 20, fontWeight: 400 }}>
              de {weekGoal}
            </span>
          </strong>
          <ProgressBar
            value={(summary.completedThisWeek / weekGoal) * 100}
            label="Exercícios da semana"
          />
          <p className="muted small" style={{ margin: "18px 0" }}>
            Valorize cada momento que você reservou para si.
          </p>
          <Button variant="outline" onClick={() => navigate("exercises")}>
            Continuar meu cuidado
          </Button>
        </Card>
      </div>
    </>
  );
}
