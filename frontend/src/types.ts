export type Route =
  | "home"
  | "login"
  | "signup"
  | "welcome"
  | "assessment"
  | "analysis"
  | "result"
  | "protocol"
  | "exercises"
  | "exercise"
  | "feedback"
  | "feedback-result"
  | "progress"
  | "profile"
  | "contact"
  | "design"
  | "admin";
export type Scenario = "vitality" | "calm";
export type EnergyLevel =
  | "Muito baixo"
  | "Baixo"
  | "Médio"
  | "Alto"
  | "Muito alto";
export type ExerciseStatus = "Não iniciado" | "Em andamento" | "Concluído";
export type ExerciseFilter =
  | "Todos"
  | "Para fazer"
  | "Em andamento"
  | "Concluídos";
export interface Exercise {
  id: string;
  name: string;
  time: number;
  icon: string;
  cat: string;
  art: string;
  desc: string;
  steps: string[];
  videoId: string;
}
export interface Profile {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birth: string;
}
export interface EnergyRecord {
  id: string;
  date: string;
  value: number;
  kind: "assessment" | "feedback";
}
export interface Feedback {
  energy?: number;
  feeling?: number;
  ease?: number;
  pain?: number;
  note: string;
}
export type FeedbackKey = Exclude<keyof Feedback, "note">;
export interface ProgressSummary {
  totalCompleted: number;
  completedThisWeek: number;
  /** Monday…Sunday. */
  activeDaysThisWeek: boolean[];
  streakDays: number;
}
export interface AppState {
  role: "USER" | "ADMIN";
  catalog: Catalog | null;
  protocolCatalog: Catalog | null;
  profile: Profile;
  energy: number | null;
  before: number | null;
  scenario: Scenario | null;
  answers: (number | null)[];
  question: number;
  completed: string[];
  currentExerciseId: string;
  history: EnergyRecord[];
  /** Last energy value of each day this week, Monday…Sunday. */
  weeklyEnergy: (number | null)[];
  summary: ProgressSummary;
  feedback: Feedback;
}
export type ModalKind =
  | "whatsapp"
  | "schedule"
  | "terms"
  | "privacy"
  | "password"
  | "forgot"
  | "delete"
  | "sample";

export interface CatalogQuestion {
  id: string;
  text: string;
  topic: string;
  active: boolean;
  options: { label: string; score: number; active: boolean }[];
}
export interface CatalogData {
  questions: CatalogQuestion[];
  exercises: (Exercise & { active: boolean })[];
  protocols: Record<Scenario, { name: string; description: string; exerciseIds: string[] }>;
  calmAbove: number;
}
export interface Catalog extends CatalogData {
  id: string;
  version: number;
}
