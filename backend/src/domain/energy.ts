import { EnergyLevel, Scenario } from "../generated/db/enums.js";

// Mirrors the rules in frontend/src/state/model.ts. They simulate UI behavior
// only and are not a clinical scoring instrument.

export const QUESTION_COUNT = 12;

/** Ordered from lowest to highest; the index is the level's weight (0–4). */
export const ENERGY_LEVELS = [
  EnergyLevel.MUITO_BAIXO,
  EnergyLevel.BAIXO,
  EnergyLevel.MEDIO,
  EnergyLevel.ALTO,
  EnergyLevel.MUITO_ALTO,
] as const;

const FEEDBACK_ENERGY_VALUES = [10, 30, 50, 70, 90] as const;

const weight = (level: EnergyLevel) => ENERGY_LEVELS.indexOf(level);

/** 0–100 score from the questionnaire answers. */
export function assessmentScore(answers: readonly EnergyLevel[]): number {
  const total = answers.reduce((sum, level) => sum + weight(level), 0);
  return Math.round((total / (QUESTION_COUNT * 4)) * 100);
}

export function scenarioForScore(score: number): Scenario {
  return score > 80 ? Scenario.CALM : Scenario.VITALITY;
}

/** Energy value (0–100) recorded when a feedback reports `level`. */
export function feedbackEnergy(level: EnergyLevel): number {
  return FEEDBACK_ENERGY_VALUES[weight(level)] ?? 50;
}
