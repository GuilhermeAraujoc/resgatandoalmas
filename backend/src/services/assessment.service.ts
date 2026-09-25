import { assessmentRepository } from "../repositories/assessment.repository.js";
import { contentService } from "./content.service.js";
import { badRequest } from "../lib/errors.js";
import type { CreateAssessmentInput } from "../validation/assessment.schemas.js";

export const assessmentService = {
  async create(userId: string, input: CreateAssessmentInput) {
    const content = await contentService.get(input.contentReleaseId);
    const questions = content.questions.filter(question => question.active);
    if (input.answers.length !== questions.length || input.answers.some((answer, i) => answer.questionId !== questions[i]?.id))
      throw badRequest("Responda todas as perguntas da versão apresentada.");
    const answerSnapshot = questions.map((question, i) => {
      const option = question.options[input.answers[i]!.optionIndex];
      if (!option?.active) throw badRequest("Uma alternativa selecionada não está disponível nesta versão.");
      return { questionId: question.id, question: question.text, label: option.label, score: option.score };
    });
    const energyScore = Math.round(answerSnapshot.reduce((sum, answer) => sum + answer.score, 0) / questions.length);
    const assessment = await assessmentRepository.create({
      userId, energyScore, scenario: energyScore > content.calmAbove ? "CALM" : "VITALITY",
      answers: input.answers.map(answer => answer.optionIndex),
      contentReleaseId: content.id, answerSnapshot,
    });
    return { ...assessment, createdAt: assessment.createdAt.toISOString() };
  },
};
