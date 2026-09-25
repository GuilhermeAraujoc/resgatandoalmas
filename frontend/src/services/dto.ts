import type { Catalog } from "../types";
// Response shapes of the backend API and the enum values it uses.

export const apiEnergyLevels = [
  "MUITO_BAIXO",
  "BAIXO",
  "MEDIO",
  "ALTO",
  "MUITO_ALTO",
] as const;
export const apiFeelings = [
  "MUITO_DESCONFORTAVEL",
  "DESCONFORTAVEL",
  "NEUTRO",
  "BEM",
  "MUITO_BEM",
] as const;
export const apiEases = [
  "MUITO_DIFICIL",
  "DIFICIL",
  "NORMAL",
  "FACIL",
  "MUITO_FACIL",
] as const;

export type ApiEnergyLevel = (typeof apiEnergyLevels)[number];
export type ApiScenario = "VITALITY" | "CALM";

export interface UserDto {
  role: "USER" | "ADMIN";
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string | null;
  birthDate: string | null;
  createdAt: string;
}

export interface AssessmentDto {
  id: string;
  energyScore: number;
  scenario: ApiScenario;
  createdAt: string;
}

export interface FeedbackDto {
  id: string;
  activityId: string;
  hadDiscomfort: boolean;
  note: string | null;
  before: number | null;
  after: number;
  createdAt: string;
}

export interface ProgressDto {
  protocolCatalog: Catalog | null;
  currentEnergy: number | null;
  scenario: ApiScenario | null;
  lastAssessmentAt: string | null;
  completedActivityIds: string[];
  summary: {
    totalCompleted: number;
    completedThisWeek: number;
    activeDaysThisWeek: boolean[];
    streakDays: number;
  };
  weeklyEnergy: (number | null)[];
  history: {
    id: string;
    date: string;
    value: number;
    kind: "assessment" | "feedback";
  }[];
}
