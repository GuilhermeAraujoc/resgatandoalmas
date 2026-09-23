import {
  exercises,
  calmExercises,
  extraExercises,
  questions,
} from "../data/catalog";
import type { ProgressDto, UserDto } from "../services/dto";
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
/** Shown until the user has an assessment or feedback on record. */
const DEFAULT_ENERGY = 50;

export function initialState(): AppState {
  return {
    profile: { name: "", email: "", cpf: "", phone: "", birth: "" },
    energy: DEFAULT_ENERGY,
    before: DEFAULT_ENERGY,
    scenario: "vitality",
    question: 0,
    answers: Array(questions.length).fill(null),
    completed: [],
    currentExerciseId: exercises[0].id,
    feedback: { note: "" },
    history: [],
    weeklyEnergy: Array(7).fill(null),
    summary: {
      totalCompleted: 0,
      completedThisWeek: 0,
      activeDaysThisWeek: Array(7).fill(false),
      streakDays: 0,
    },
  };
}

export function profileFromUser(user: UserDto): Profile {
  return {
    name: user.name,
    email: user.email,
    cpf: user.cpf,
    phone: user.phone ?? "",
    birth: user.birthDate ?? "",
  };
}

export type Action =
  | { type: "profile"; profile: Profile }
  | { type: "progress"; progress: ProgressDto }
  | { type: "answer"; index: number; value: number }
  | { type: "question"; index: number }
  | { type: "assessed"; energy: number; scenario: Scenario }
  | { type: "scenario"; scenario: Scenario }
  | { type: "start"; id: string }
  | { type: "finish" }
  | { type: "feedback"; value: Partial<Feedback> }
  | { type: "feedback-saved"; before: number | null; after: number }
  | { type: "reset" };

// Scores and scenarios come from the backend; these rules only keep the UI in sync.
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "profile":
      return { ...state, profile: action.profile };
    case "progress": {
      const { progress } = action;
      const scenario: Scenario =
        progress.scenario === "CALM"
          ? "calm"
          : progress.scenario === "VITALITY"
            ? "vitality"
            : state.scenario;
      return {
        ...state,
        energy: progress.currentEnergy ?? DEFAULT_ENERGY,
        scenario,
        completed: progress.completedActivityIds,
        currentExerciseId: libraryItems(scenario).some(
          (e) => e.id === state.currentExerciseId,
        )
          ? state.currentExerciseId
          : protocolItems(scenario)[0].id,
        history: progress.history,
        weeklyEnergy: progress.weeklyEnergy,
        summary: progress.summary,
      };
    }
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
    case "assessed":
      // A new assessment restarts the protocol.
      return {
        ...state,
        energy: action.energy,
        scenario: action.scenario,
        completed: [],
        currentExerciseId: protocolItems(action.scenario)[0].id,
      };
    case "scenario":
      return {
        ...state,
        scenario: action.scenario,
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
    case "feedback-saved":
      return {
        ...state,
        before: action.before ?? state.before,
        energy: action.after,
        completed: [...new Set([...state.completed, state.currentExerciseId])],
      };
    case "reset":
      return initialState();
  }
}
