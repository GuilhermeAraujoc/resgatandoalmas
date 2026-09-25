import { prisma } from "../src/lib/prisma.js";
import { catalogSchema } from "../src/validation/content.schemas.js";
import { initialQuestions } from "./questions.js";
import { ENERGY_LEVELS } from "../src/domain/energy.js";

export async function initializeContent() {
  await prisma.$transaction(async tx => {
    let baseline = await tx.contentRelease.findUnique({ where: { version: 1 } });
    if (!baseline) {
      const activities = await tx.activity.findMany({ orderBy: { protocolOrder: "asc" } });
      const labels = ["Muito baixo", "Baixo", "Médio", "Alto", "Muito alto"];
      const data = catalogSchema.parse({
        questions: initialQuestions.map((text, index) => ({ id: `question-${index}`, text, topic: "Bem-estar", active: true, options: labels.map((label, i) => ({ label, score: i * 25, active: true })) })),
        exercises: activities.map(a => ({ id: a.id, name: a.name, cat: a.category, desc: a.description, time: a.durationMinutes, steps: a.steps, icon: a.icon, art: a.color ?? "", videoId: a.videoId, active: true })),
        calmAbove: 80,
        protocols: {
          vitality: { name: "Movimento e vitalidade", description: "Explorar movimento, criatividade e vitalidade no seu ritmo.", exerciseIds: activities.filter(a => a.scenario === "VITALITY").map(a => a.id) },
          calm: { name: "Presença e serenidade", description: "Desacelerar e direcionar sua energia.", exerciseIds: activities.filter(a => a.scenario === "CALM").map(a => a.id) },
        },
      });
      baseline = await tx.contentRelease.create({ data: { version: 1, data } });
    }
    await tx.contentDraft.upsert({ where: { id: "main" }, update: {}, create: { id: "main", revision: 1, data: baseline.data! } });
    const original = catalogSchema.parse(baseline.data);
    const oldAssessments = await tx.assessment.findMany({ where: { contentReleaseId: null }, include: { answers: { orderBy: { questionIndex: "asc" } } } });
    for (const assessment of oldAssessments) {
      const answerSnapshot = assessment.answers.map(answer => {
        const question = original.questions[answer.questionIndex];
        const option = question?.options[ENERGY_LEVELS.indexOf(answer.level!)];
        return { question: question?.text ?? "Pergunta original indisponível", label: option?.label ?? answer.level, score: option?.score ?? null };
      });
      await tx.assessment.update({ where: { id: assessment.id }, data: { contentReleaseId: baseline.id, answerSnapshot } });
    }
    for (const exercise of original.exercises) {
      await tx.userActivity.updateMany({ where: { activityId: exercise.id, contentReleaseId: null }, data: { contentReleaseId: baseline.id, activitySnapshot: exercise } });
    }
  }, { timeout: 60000 });
}
