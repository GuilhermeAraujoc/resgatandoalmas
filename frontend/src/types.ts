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
  | "design";
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
export interface FeedbackRecord extends Feedback {
  exerciseId: string;
  before: number;
  after: number;
  date: string;
}
export interface AppState {
  profile: Profile;
  energy: number;
  before: number;
  scenario: Scenario;
  answers: (number | null)[];
  question: number;
  completed: string[];
  currentExerciseId: string;
  history: EnergyRecord[];
  feedback: Feedback;
  feedbackHistory: FeedbackRecord[];
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
