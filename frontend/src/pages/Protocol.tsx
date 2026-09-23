import { useApp } from "../state/AppContext";
import { protocolItems } from "../state/model";
import {
  Badge,
  Button,
  Card,
  EnergyLevelIndicator,
  Icon,
  PageHeader,
  Tabs,
} from "../components/ui";
export function Protocol() {
  const { state, dispatch, startExercise } = useApp();
  const calm = state.scenario === "calm";
  return (
    <>
      <PageHeader
        title="Meu Protocolo"
        subtitle="Um cuidado de cada vez, no seu ritmo."
      />
      <Tabs
        values={["Movimento e vitalidade", "Desaceleração e presença"] as const}
        value={calm ? "Desaceleração e presença" : "Movimento e vitalidade"}
        label="Cenários de demonstração"
        onChange={(value) =>
          dispatch({
            type: "scenario",
            scenario: value === "Movimento e vitalidade" ? "vitality" : "calm",
          })
        }
      />
      <Card className="protocol-feature">
        <div className="between">
          <div>
            <span className="eyebrow">Protocolo de equilíbrio energético</span>
            <h2 style={{ margin: "14px 0" }}>
              {calm ? "Presença e serenidade" : "Chakra Sacro · Svadhisthana"}
            </h2>
            <p>
              Objetivo:{" "}
              {calm
                ? "desacelerar e direcionar sua energia."
                : "explorar movimento, criatividade e vitalidade."}
            </p>
          </div>
          <EnergyLevelIndicator value={state.energy} circular />
        </div>
        <div style={{ maxWidth: 620, marginTop: 25 }}>
          <EnergyLevelIndicator value={state.energy} />
        </div>
        <p style={{ marginTop: 18 }}>
          Direção desejada: mais equilíbrio · Cada pessoa tem seu próprio ritmo.
        </p>
      </Card>
      <Card style={{ marginTop: 22 }}>
        <h3>Entenda seu momento</h3>
        <p className="muted small" style={{ marginTop: 12 }}>
          {calm
            ? "As práticas deste cenário convidam à organização e à presença, com movimentos lentos e cores suaves."
            : "Este cenário de bem-estar utiliza o Chakra Sacro como referência cultural para práticas de movimento e expressão. Não representa uma medição física da energia."}{" "}
          Escolha um momento tranquilo e respeite seus limites.
        </p>
      </Card>
      <h2 className="section-label">O que você deve fazer</h2>
      <div className="stack steps">
        {protocolItems(state.scenario).map((exercise, index) => {
          const done = state.completed.includes(exercise.id);
          return (
            <Card key={exercise.id}>
              <span className="stepnum">
                {done ? (
                  <Icon name="check" />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </span>
              <div>
                <span className="eyebrow">
                  Etapa {index + 1} · {exercise.time} minutos
                </span>
                <h3 style={{ marginTop: 5 }}>{exercise.name}</h3>
                <p>{exercise.desc}</p>
              </div>
              <Badge success={done}>
                {done
                  ? "Concluído"
                  : state.currentExerciseId === exercise.id
                    ? "Em andamento"
                    : "Não iniciado"}
              </Badge>
              <Button
                variant={done ? "outline" : "primary"}
                onClick={() => startExercise(exercise.id)}
              >
                {done ? "Revisitar" : "Começar"}
              </Button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
