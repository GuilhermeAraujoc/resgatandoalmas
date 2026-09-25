import type { Prisma } from "../generated/db/client.js";
import { prisma } from "../lib/prisma.js";
import type { Scenario } from "../generated/db/enums.js";

export const assessmentRepository = {
  create: (data: {
    userId: string;
    energyScore: number;
    scenario: Scenario;
    answers: readonly number[];
    contentReleaseId: string;
    answerSnapshot: Prisma.InputJsonValue;
  }) =>
    prisma.assessment.create({
      data: {
        userId: data.userId,
        contentReleaseId: data.contentReleaseId,
        answerSnapshot: data.answerSnapshot,
        energyScore: data.energyScore,
        scenario: data.scenario,
        answers: {
          create: data.answers.map((selectedOptionIndex, questionIndex) => ({
            questionIndex,
            selectedOptionIndex,
          })),
        },
      },
      select: { id: true, energyScore: true, scenario: true, contentReleaseId: true, createdAt: true },
    }),

  findLatest: (userId: string) =>
    prisma.assessment.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, energyScore: true, scenario: true, contentReleaseId: true, createdAt: true },
    }),

  findRecent: (userId: string, take: number) =>
    prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, energyScore: true, scenario: true, contentReleaseId: true, createdAt: true },
    }),

  findEnergySince: (userId: string, since: Date) =>
    prisma.assessment.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { id: true, energyScore: true, createdAt: true },
    }),
};
