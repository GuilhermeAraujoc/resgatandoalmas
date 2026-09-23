import { useApp } from "../state/AppContext";
import { energyLabel } from "../state/model";
import {
  Badge,
  Button,
  Card,
  EnergyChart,
  EnergyLevelIndicator,
  PageHeader,
} from "../components/ui";
export function Progress() {
  const { state, navigate } = useApp();
  const assessments = state.history.filter(
    (record) => record.kind === "assessment",
  );
  const stats = [
    ["Energia atual", energyLabel(state.energy), "Seu último registro"],
    ["Evolução", "Em acompanhamento", "Observe como você se sente"],
    [
      "Exercícios realizados",
      String(state.feedbackHistory.length),
      "Momentos de autocuidado",
    ],
    ["Avaliações", String(assessments.length), "Registros realizados"],
  ];
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
          Eixo horizontal: datas dos registros. Eixo vertical: índice de
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
          {assessments.length === 0 && <p className="muted">Nenhuma avaliação registrada.</p>}
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
          <h3>Atividades registradas</h3>
          <strong>{state.feedbackHistory.length}</strong>
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
