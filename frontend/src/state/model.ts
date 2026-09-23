import {
  exercises,
  calmExercises,
  extraExercises,
  questions,
} from "../data/catalog";
import type {
  AppState,
  EnergyLevel,
  Feedback,
  Profile,
  Scenario,
  FeedbackKey,
} from "../types";

export const energyLevels: EnergyLevel[] = [
  "Muito baixo",
  "Baixo",
  "Médio",
  "Alto",
  "Muito alto",
];
export function energyLabel(value: number | null): EnergyLevel | "Sem avaliação" {
  if (value === null) return "Sem avaliação";
  const bounded = Math.max(0, Math.min(100, value));
  return energyLevels[
    bounded <= 20
      ? 0
      : bounded <= 40
        ? 1
        : bounded <= 60
          ? 2
          : bounded <= 80
            ? 3
            : 4
  ];
}
export function protocolItems(scenario: Scenario | null) {
  return scenario === null ? [] : scenario === "calm" ? calmExercises : exercises;
}
export function libraryItems(scenario: Scenario | null) {
  return [...protocolItems(scenario), ...extraExercises];
}
export const feedbackKeys: FeedbackKey[] = [
  "energy",
  "feeling",
  "ease",
  "pain",
];
export function isFeedbackComplete(feedback: Feedback) {
  return feedbackKeys.every(
    (key) =>
      Number.isInteger(feedback[key]) &&
      feedback[key]! >= 0 &&
      feedback[key]! <= (key === "pain" ? 1 : 4),
  );
}
export function initialState(): AppState {
  return {
    profile: { name: "", email: "", phone: "", birth: "" },
    energy: null,
    before: null,
    scenario: null,
    question: 0,
    answers: Array(questions.length).fill(null),
    completed: [],
    currentExerciseId: "",
    feedback: { note: "" },
    feedbackHistory: [],
    history: [],
  };
}
export type Action =
  | { type: "profile"; profile: Profile }
  | { type: "answer"; index: number; value: number }
  | { type: "question"; index: number }
  | { type: "hydrate"; state: AppState }
  | { type: "start"; id: string }
  | { type: "finish" }
  | { type: "feedback"; value: Partial<Feedback> }
  | { type: "reset" };

// Only UI drafts are changed locally. Persisted data comes from the API.
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "profile":
      return { ...state, profile: action.profile };
    case "answer": {
      if (
        action.index < 0 ||
        action.index >= questions.length ||
        !Number.isInteger(action.value) ||
        action.value < 0 ||
        action.value > 4
      )
        return state;
      return {
        ...state,
        answers: state.answers.map((v, i) =>
          i === action.index ? action.value : v,
        ),
      };
    }
    case "question":
      return {
        ...state,
        question: Math.max(0, Math.min(questions.length - 1, action.index)),
      };
    case "hydrate":
      return action.state;
    case "start":
      return libraryItems(state.scenario).some((e) => e.id === action.id)
        ? { ...state, currentExerciseId: action.id }
        : state;
    case "finish":
      return { ...state, before: state.energy, feedback: { note: "" } };
    case "feedback":
      return { ...state, feedback: { ...state.feedback, ...action.value } };
    case "reset":
      return initialState();
  }
}
