import { useEffect, useRef, useState } from "react";
import { useApp } from "../state/AppContext";
import { questions } from "../data/catalog";
import { energyLabel, energyLevels } from "../state/model";
import {
  Button,
  Card,
  EnergyLevelIndicator,
  Icon,
  Notice,
  PageHeader,
  ProgressBar,
} from "../components/ui";
import { errorMessage } from "../services/api";
const topics = [
  "Disposição",
  "Motivação",
  "Criatividade",
  "Novos caminhos",
  "Bem-estar",
  "Realização",
  "Pensamentos",
  "Experiências",
  "Rotina",
  "Movimento",
  "Emoções",
  "Equilíbrio",
];
export function Assessment() {
  const { state, dispatch, navigate, notify, submitAssessment } = useApp();
  const [pending, setPending] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, [state.question]);
  const next = async () => {
    if (state.answers[state.question] === null) return;
    if (state.question < questions.length - 1) {
      dispatch({ type: "question", index: state.question + 1 });
      return;
    }
    setPending(true);
    try {
      await submitAssessment();
      navigate("analysis");
    } catch (error) {
      notify(errorMessage(error));
      setPending(false);
    }
  };
  return (
    <div className="assessment">
      <PageHeader
        title="Avaliação energética"
        subtitle="Um momento de atenção a você. Responda no seu ritmo."
      />
      <div className="between small muted">
        <span>
          Pergunta {state.question + 1} de {questions.length}
        </span>
        <span>Aproximadamente 3 minutos</span>
      </div>
      <div style={{ marginTop: 14 }}>
        <ProgressBar
          value={((state.question + 1) / questions.length) * 100}
          label="Questionário"
        />
      </div>
      <Card className="questionbox">
        <span className="eyebrow">{topics[state.question]}</span>
        <h2 ref={title} tabIndex={-1} style={{ outline: "none" }}>
          {questions[state.question]}
        </h2>
        <div className="choices" role="radiogroup" aria-label="Sua resposta">
          {energyLevels.map((level, index) => (
            <label
              key={level}
              className={`choice ${state.answers[state.question] === index ? "selected" : ""}`}
            >
              <input
                className="sr-only"
                type="radio"
                name={`question-${state.question}`}
                checked={state.answers[state.question] === index}
                onChange={() =>
                  dispatch({
                    type: "answer",
                    index: state.question,
                    value: index,
                  })
                }
              />
              {level}
            </label>
          ))}
        </div>
        <div className="between questionfoot">
          <Button
            variant="outline"
            icon={false}
            disabled={state.question === 0}
            onClick={() =>
              dispatch({ type: "question", index: state.question - 1 })
            }
          >
            Anterior
          </Button>
          <Button
            disabled={state.answers[state.question] === null || pending}
            onClick={next}
          >
            {state.question === questions.length - 1
              ? "Ver meu resultado"
              : "Continuar"}
          </Button>
        </div>
      </Card>
      <p className="footer-note">
        Não existem respostas certas ou erradas.
        <br />
        Esta avaliação não substitui uma avaliação profissional.
      </p>
    </div>
  );
}
const analysisSteps = [
  "Analisando respostas",
  "Identificando padrão energético",
  "Organizando seu momento",
  "Criando protocolo personalizado",
  "Preparando recomendações",
];
export function Analysis() {
  const [step, setStep] = useState(0);
  const { navigate } = useApp();
  useEffect(() => {
    if (step >= analysisSteps.length) {
      const end = setTimeout(() => navigate("result"), 500);
      return () => clearTimeout(end);
    }
    const timer = setTimeout(() => setStep((v) => v + 1), 650);
    return () => clearTimeout(timer);
  }, [step, navigate]);
  return (
    <Card className="narrow center" style={{ marginTop: 65 }}>
      <div className="loading-orbit">
        <Icon name="spark" />
      </div>
      <h1>Estamos analisando sua energia</h1>
      <p className="muted" style={{ margin: "18px 0 28px" }}>
        Estamos organizando suas respostas para preparar seu protocolo
        personalizado.
      </p>
      <div aria-live="polite">
        {analysisSteps.map((text, index) => (
          <div className="analysis-step" key={text}>
            <span>{text}</span>
            <span>{index < step ? "✓" : "···"}</span>
          </div>
        ))}
      </div>
      <p className="footer-note">
        Simulação de personalização · sem análise real por IA
      </p>
    </Card>
  );
}
export function Result() {
  const { state, navigate } = useApp();
  const calm = state.scenario === "calm";
  return (
    <>
      <PageHeader
        title="Seu resultado energético"
        subtitle="Um ponto de partida para cuidar de você."
      />
      <div className="grid two">
        <Card>
          <span className="eyebrow">Seu momento de hoje</span>
          <h2 className="resulttitle">{energyLabel(state.energy)}</h2>
          <EnergyLevelIndicator value={state.energy} />
          <div style={{ marginTop: 32 }}>
            <span className="eyebrow">Estado energético identificado</span>
            <h2 style={{ margin: "12px 0" }}>
              {calm
                ? "Energia intensa"
                : state.energy !== null && state.energy <= 40
                  ? "Disposição reduzida"
                  : "Em busca de equilíbrio"}
            </h2>
            <p className="muted small">
              Uma leitura ilustrativa das suas respostas, sem finalidade
              diagnóstica.
            </p>
          </div>
        </Card>
        <Card className="stack">
          <h3>O que identificamos</h3>
          <p className="muted small">
            {calm
              ? "Você relatou energia intensa. O programa apresenta práticas de desaceleração, presença e direcionamento."
              : "Suas respostas ajudam a observar disposição, movimento e expressão criativa. Este programa apresenta atividades leves para explorar o seu bem-estar."}
          </p>
          <h3>O que isso significa?</h3>
          <p className="muted small">
            Seu estado pode variar ao longo do dia. Use este momento como um
            convite para perceber suas necessidades, sem se comparar.
          </p>
          <h3>Objetivo do seu protocolo</h3>
          <p className="muted small">
            {calm
              ? "Cultivar organização, calma e presença."
              : "Estimular movimento, vitalidade, criatividade e expressão de forma gradual."}
          </p>
        </Card>
      </div>
      <div style={{ margin: "23px 0" }}>
        <Notice>
          Esta avaliação possui finalidade complementar de bem-estar e não
          substitui avaliação, diagnóstico ou tratamento realizado por
          profissionais de saúde.
        </Notice>
      </div>
      <Button onClick={() => navigate("protocol")}>Ver meu protocolo</Button>
    </>
  );
}
