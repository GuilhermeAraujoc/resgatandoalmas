import { request } from "./api";
import type { AssessmentDto } from "./dto";
import type { Catalog } from "../types";
export async function createAssessment(answers: number[], catalog: Catalog) {
  const questions = catalog.questions.filter(question => question.active);
  const { assessment } = await request<{ assessment: AssessmentDto }>("POST", "/assessments", {
    contentReleaseId: catalog.id,
    answers: answers.map((optionIndex, index) => ({ questionId: questions[index].id, optionIndex })),
  });
  return assessment;
}
