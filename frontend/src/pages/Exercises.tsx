import { useState } from "react";
import { useApp } from "../state/AppContext";
import { libraryItems } from "../state/model";
import type { ExerciseFilter } from "../types";
import {
  Badge,
  Button,
  Card,
  ExerciseArt,
  PageHeader,
  Tabs,
} from "../components/ui";
export function Exercises() {
  const { state, startExercise } = useApp();
  const [filter, setFilter] = useState<ExerciseFilter>("Todos");
  const list = libraryItems(state.scenario, state.protocolCatalog ?? state.catalog).filter((exercise) => {
    const done = state.completed.includes(exercise.id);
    const current = state.currentExerciseId === exercise.id;
    return (
      filter === "Todos" ||
      (filter === "Concluídos" && done) ||
      (filter === "Para fazer" && !done && !current) ||
      (filter === "Em andamento" && current && !done)
    );
  });
  return (
    <>
      <PageHeader
        title="Meus Exercícios"
        subtitle="Encontre um momento para se reconectar."
      />
      <Tabs
        values={["Todos", "Para fazer", "Em andamento", "Concluídos"] as const}
        value={filter}
        onChange={setFilter}
        label="Filtrar exercícios"
      />
      <div className="grid three">
        {list.map((exercise) => (
          <Card className="exercise-card" key={exercise.id}>
            <ExerciseArt icon={exercise.icon} color={exercise.art} />
            <div className="info">
              <span className="eyebrow">{exercise.cat}</span>
              <h3 style={{ marginTop: 9 }}>{exercise.name}</h3>
              <p>{exercise.time} min · Iniciante</p>
              <Badge success={state.completed.includes(exercise.id)}>
                {state.completed.includes(exercise.id)
                  ? "Concluído ✓"
                  : state.currentExerciseId === exercise.id
                    ? "Em andamento"
                    : "Para fazer"}
              </Badge>
              <Button
                variant="outline"
                full
                onClick={() => startExercise(exercise.id)}
              >
                Abrir exercício
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {list.length === 0 && (
        <p className="muted">Nenhum exercício nesta categoria por enquanto.</p>
      )}
    </>
  );
}
