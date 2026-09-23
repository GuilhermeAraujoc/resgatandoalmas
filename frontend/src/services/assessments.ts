import { request } from "./api";
import { apiEnergyLevels, type AssessmentDto } from "./dto";

/** `answers` are the selected level indexes (0–4), one per question. */
export async function createAssessment(answers: number[]) {
  const { assessment } = await request<{ assessment: AssessmentDto }>(
    "POST",
    "/assessments",
    { answers: answers.map((index) => apiEnergyLevels[index]) },
  );
  return assessment;
}
