import { useState } from "react";
import { useApp } from "../state/AppContext";
import { errorMessage } from "../services/api";
import {
  energyLabel,
  energyLevels,
  isFeedbackComplete,
  protocolItems,
} from "../state/model";
import type { FeedbackKey } from "../types";
import {
  Button,
  Card,
  EnergyLevelIndicator,
  Field,
  Icon,
  Notice,
} from "../components/ui";
const groups: { key: FeedbackKey; question: string; options: string[] }[] = [
  {
    key: "energy",
    question: "Como está seu nível de energia agora?",
    options: energyLevels,
  },
  {
    key: "feeling",
    question: "Como você se sentiu durante o exercício?",
    options: [
      "Muito desconfortável",
      "Desconfortável",
      "Neutro",
      "Bem",
      "Muito bem",
    ],
  },
  {
    key: "ease",
    question: "O exercício foi fácil de realizar?",
    options: ["Muito difícil", "Difícil", "Normal", "Fácil", "Muito fácil"],
  },
  {
    key: "pain",
    question: "Sentiu algum desconforto?",
    options: ["Sim", "Não"],
  },
];
export function Feedback() {
  const { state, dispatch, navigate, notify, submitFeedback } = useApp();
  const [pending, setPending] = useState(false);
  return (
    <div className="narrow">
      <Card>
        <div className="intro-icon">
          <Icon name="heart" />
        </div>
        <h1 className="center">Como você está se sentindo?</h1>
        <p className="center muted small" style={{ marginTop: 12 }}>
          Suas respostas ajudam a acompanhar sua evolução e ajustar seu
          protocolo.
        </p>
        {groups.map((group) => (
          <fieldset className="feedback-group" key={group.key}>
            <legend>{group.question}</legend>
            <div className="feedback-options">
              {group.options.map((option, index) => (
                <label
                  key={option}
                  className={`feedback-choice ${state.feedback[group.key] === index ? "selected" : ""}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name={group.key}
                    checked={state.feedback[group.key] === index}
                    onChange={() =>
                      dispatch({
                        type: "feedback",
                        value: { [group.key]: index },
                      })
                    }
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <Field label="Conte para nós como você está se sentindo (opcional)">
          <textarea
            rows={3}
            placeholder="Este espaço é seu..."
            value={state.feedback.note}
            onChange={(event) =>
              dispatch({
                type: "feedback",
                value: { note: event.target.value },
              })
            }
          />
        </Field>
        <Button
          full
          style={{ marginTop: 25 }}
          disabled={!isFeedbackComplete(state.feedback) || pending}
          onClick={async () => {
            setPending(true);
            try {
              await submitFeedback();
              navigate("feedback-result");
            } catch (error) {
              notify(errorMessage(error));
              setPending(false);
            }
          }}
        >
          Enviar feedback
        </Button>
      </Card>
    </div>
  );
}
export function FeedbackResult() {
  const { state, navigate, startExercise } = useApp();
  const next = protocolItems(state.scenario).find(
    (item) => !state.completed.includes(item.id),
  );
  const discomfort = state.feedback.pain === 0;
  return (
    <Card className="narrow center">
      <div className="intro-icon">
        <Icon name="check" />
      </div>
      <h1>Feedback registrado</h1>
      <p className="muted" style={{ marginTop: 14 }}>
        Obrigado por compartilhar seu momento.
      </p>
      <div className="grid two" style={{ margin: "30px 0", textAlign: "left" }}>
        {[
          { title: "Antes do exercício", value: state.before },
          { title: "Depois do exercício", value: state.energy },
        ].map((item) => (
          <Card key={item.title}>
            <span className="eyebrow">{item.title}</span>
            <h2 style={{ margin: "14px 0" }}>{energyLabel(item.value)}</h2>
            <EnergyLevelIndicator value={item.value} />
          </Card>
        ))}
      </div>
      <p className="muted small">
        {state.energy !== null && state.before !== null && state.energy > state.before
          ? "Você relatou mais energia após esta atividade."
          : "Vamos continuar acompanhando sua evolução. Seu protocolo poderá ser ajustado conforme seus próximos feedbacks."}
      </p>
      {discomfort && (
        <div style={{ marginTop: 20 }}>
          <Notice>
            Você relatou desconforto. Faça uma pausa e evite repetir movimentos
            que provoquem dor. Se o desconforto persistir, procure orientação de
            um profissional de saúde.
          </Notice>
        </div>
      )}
      <div style={{ marginTop: 26 }}>
        <Button
          onClick={() => {
            if (discomfort) navigate("protocol");
            else if (next) startExercise(next.id);
            else navigate("progress");
          }}
        >
          {discomfort
            ? "Voltar ao protocolo"
            : next
              ? "Próximo exercício"
              : "Ver meu progresso"}
        </Button>
      </div>
      <p className="footer-note">
        Atualização baseada no seu relato · sem medição fisiológica
      </p>
    </Card>
  );
}
