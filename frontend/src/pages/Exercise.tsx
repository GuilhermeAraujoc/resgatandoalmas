import { useApp } from "../state/AppContext";
import { libraryItems, protocolItems } from "../state/model";
import { useCountdown } from "../hooks/useCountdown";
import { Button, Card, Notice, PageHeader } from "../components/ui";
export function Exercise() {
  const { state, dispatch, navigate } = useApp();
  const exercise =
    libraryItems(state.scenario, state.protocolCatalog ?? state.catalog).find(
      (item) => item.id === state.currentExerciseId,
    ) ?? protocolItems(state.scenario, state.protocolCatalog ?? state.catalog)[0];
  const index = protocolItems(state.scenario, state.protocolCatalog ?? state.catalog).findIndex(
    (item) => item.id === exercise?.id,
  );
  const timer = useCountdown((exercise?.time ?? 0) * 60);
  if (!exercise) return <Card>Nenhum exercício disponível.</Card>;
  const videoId = exercise.videoId;
  return (
    <>
      <PageHeader
        title={exercise.name}
        subtitle={`${index >= 0 ? `Exercício ${index + 1} de ${protocolItems(state.scenario, state.protocolCatalog ?? state.catalog).length}` : "Prática complementar"} · ${exercise.time} minutos · Fácil`}
        extra={
          <a className="textlink" href="/protocol">
            Voltar ao protocolo
          </a>
        }
      />
      <div className="grid dashboard">
        <div className="stack">
          <div className="video">
            {videoId ? <iframe
              src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0`}
              title={exercise.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            /> : <p className="muted">Vídeo ainda não disponível.</p>}
          </div>
          <Card>
            <h3>Como realizar</h3>
            <ol className="instructions">
              {exercise.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Card>
        </div>
        <div className="stack" style={{ alignContent: "start" }}>
          <Card className="center">
            <span className="eyebrow">Seu tempo de cuidado</span>
            <div className="timer" aria-label="Tempo restante">
              {timer.label}
            </div>
            <p className="small muted">
              O cronômetro é opcional.
              <br />
              Respeite o seu ritmo.
            </p>
            <Button
              variant="outline"
              full
              icon={false}
              style={{ margin: "22px 0 10px" }}
              onClick={timer.toggle}
              disabled={timer.remaining === 0}
            >
              {timer.remaining === 0
                ? "Tempo concluído"
                : timer.running
                  ? "Pausar"
                  : timer.remaining === exercise.time * 60
                    ? "Iniciar cronômetro"
                    : "Retomar"}
            </Button>
            <Button
              full
              icon="check"
              onClick={() => {
                dispatch({ type: "finish" });
                navigate("feedback");
              }}
            >
              Finalizar exercício
            </Button>
          </Card>
          <Notice>
            <h3 style={{ fontSize: 14, marginBottom: 10 }}>Preste atenção</h3>Os
            movimentos devem ser suaves e confortáveis. Interrompa a atividade
            caso sinta dor ou desconforto.
          </Notice>
        </div>
      </div>
    </>
  );
}
