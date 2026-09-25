import type { ProgressDto, UserDto } from "../services/dto";
import type {
  AppState,
  Catalog,
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
export function protocolItems(scenario: Scenario | null, catalog?: Catalog | null) {
  if (!scenario || !catalog) return [];
  return catalog.protocols[scenario].exerciseIds.flatMap(id => {
    const exercise = catalog.exercises.find(item => item.id === id && item.active);
    return exercise ? [exercise] : [];
  });
}
export function libraryItems(scenario: Scenario | null, catalog?: Catalog | null) {
  if (!catalog) return [];
  const assigned = new Set(Object.values(catalog.protocols).flatMap(protocol => protocol.exerciseIds));
  return [...protocolItems(scenario, catalog), ...catalog.exercises.filter(item => item.active && !assigned.has(item.id))];
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
    role: "USER",
    catalog: null,
    protocolCatalog: null,
    profile: { name: "", email: "", cpf: "", phone: "", birth: "" },
    energy: null,
    before: null,
    scenario: null,
    question: 0,
    answers: [],
    completed: [],
    currentExerciseId: "",
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
  | { type: "profile"; profile: Profile; role?: "USER" | "ADMIN" }
  | { type: "catalog"; catalog: Catalog }
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
      return { ...state, profile: action.profile, role: action.role ?? state.role };
    case "catalog":
      return { ...state, catalog: action.catalog, answers: action.catalog.id === state.catalog?.id ? state.answers : action.catalog.questions.filter(item => item.active).map(() => null), question: action.catalog.id === state.catalog?.id ? state.question : 0 };
    case "progress": {
      const { progress } = action;
      const scenario: Scenario | null =
        progress.scenario === "CALM"
          ? "calm"
          : progress.scenario === "VITALITY"
            ? "vitality"
            : null;
      return {
        ...state,
        protocolCatalog: progress.protocolCatalog ?? null,
        energy: progress.currentEnergy,
        scenario,
        completed: progress.completedActivityIds,
        currentExerciseId: libraryItems(scenario, progress.protocolCatalog ?? state.catalog).some(
          (e) => e.id === state.currentExerciseId,
        )
          ? state.currentExerciseId
          : protocolItems(scenario, progress.protocolCatalog ?? state.catalog)[0]?.id ?? "",
        history: progress.history,
        weeklyEnergy: progress.weeklyEnergy,
        summary: progress.summary,
      };
    }
    case "answer": {
      if (
        action.index < 0 ||
        action.index >= state.answers.length ||
        !Number.isInteger(action.value) ||
        action.value < 0 ||
        !state.catalog?.questions.filter(item => item.active)[action.index]?.options[action.value]?.active
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
        question: Math.max(0, Math.min(state.answers.length - 1, action.index)),
      };
    case "assessed":
      // A new assessment restarts the protocol.
      return {
        ...state,
        energy: action.energy,
        scenario: action.scenario,
        completed: [],
        currentExerciseId: protocolItems(action.scenario, state.catalog)[0]?.id ?? "",
      };
    case "scenario":
      return {
        ...state,
        scenario: action.scenario,
        currentExerciseId: protocolItems(action.scenario, state.catalog)[0]?.id ?? "",
      };
    case "start":
      return libraryItems(state.scenario, state.protocolCatalog ?? state.catalog).some((e) => e.id === action.id)
        ? { ...state, currentExerciseId: action.id }
        : state;
    case "finish":
      return { ...state, before: state.energy, feedback: { note: "" } };
    case "feedback":
      return { ...state, feedback: { ...state.feedback, ...action.value } };
    case "feedback-saved":
      return {
        ...state,
        before: action.before,
        energy: action.after,
        completed: [...new Set([...state.completed, state.currentExerciseId])],
      };
    case "reset":
      return initialState();
  }
}
