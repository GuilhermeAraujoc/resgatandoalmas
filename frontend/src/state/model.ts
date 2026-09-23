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
export function energyLabel(value: number): EnergyLevel {
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
export function protocolItems(scenario: Scenario) {
  return scenario === "calm" ? calmExercises : exercises;
}
export function libraryItems(scenario: Scenario) {
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
    profile: {
      name: "Mariana Silva",
      email: "mariana@exemplo.com",
      phone: "",
      birth: "",
    },
    energy: 55,
    before: 38,
    scenario: "vitality",
    question: 0,
    answers: Array(questions.length).fill(null),
    completed: [exercises[0].id, exercises[2].id, exercises[3].id],
    currentExerciseId: exercises[1].id,
    feedback: { note: "" },
    feedbackHistory: [],
    history: [
      {
        id: "demo-1",
        date: "2026-09-03T12:00:00",
        value: 28,
        kind: "assessment",
      },
      {
        id: "demo-2",
        date: "2026-09-07T12:00:00",
        value: 41,
        kind: "assessment",
      },
      {
        id: "demo-3",
        date: "2026-09-13T12:00:00",
        value: 55,
        kind: "assessment",
      },
    ],
  };
}
export type Action =
  | { type: "profile"; profile: Profile }
  | { type: "answer"; index: number; value: number }
  | { type: "question"; index: number }
  | { type: "evaluate"; date: string }
  | { type: "scenario"; scenario: Scenario }
  | { type: "start"; id: string }
  | { type: "finish" }
  | { type: "feedback"; value: Partial<Feedback> }
  | { type: "submit-feedback"; date: string }
  | { type: "reset" };

// These rules simulate UI behavior only. They are not a clinical scoring instrument.
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
    case "evaluate": {
      if (state.answers.some((v) => v === null)) return state;
      const energy = Math.round(
        (state.answers.reduce<number>((sum, value) => sum + (value ?? 0), 0) /
          (questions.length * 4)) *
          100,
      );
      const scenario: Scenario = energy > 80 ? "calm" : "vitality";
      return {
        ...state,
        energy,
        scenario,
        completed: [],
        currentExerciseId: protocolItems(scenario)[0].id,
        history: [
          ...state.history,
          {
            id: `assessment-${state.history.length}`,
            date: action.date,
            value: energy,
            kind: "assessment",
          },
        ],
      };
    }
    case "scenario":
      return {
        ...state,
        scenario: action.scenario,
        energy: action.scenario === "calm" ? 90 : 38,
        completed: [],
        currentExerciseId: protocolItems(action.scenario)[0].id,
      };
    case "start":
      return libraryItems(state.scenario).some((e) => e.id === action.id)
        ? { ...state, currentExerciseId: action.id }
        : state;
    case "finish":
      return { ...state, before: state.energy, feedback: { note: "" } };
    case "feedback":
      return { ...state, feedback: { ...state.feedback, ...action.value } };
    case "submit-feedback": {
      if (!isFeedbackComplete(state.feedback)) return state;
      const energy = [10, 30, 50, 70, 90][state.feedback.energy!];
      return {
        ...state,
        energy,
        completed: [...new Set([...state.completed, state.currentExerciseId])],
        history: [
          ...state.history,
          {
            id: `feedback-${state.history.length}`,
            date: action.date,
            value: energy,
            kind: "feedback",
          },
        ],
        feedbackHistory: [
          ...state.feedbackHistory,
          {
            ...state.feedback,
            before: state.before,
            after: energy,
            exerciseId: state.currentExerciseId,
            date: action.date,
          },
        ],
      };
    }
    case "reset":
      return initialState();
  }
}
