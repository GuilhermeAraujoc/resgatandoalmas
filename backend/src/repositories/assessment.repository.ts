import { prisma } from "../lib/prisma.js";
import type { EnergyLevel, Scenario } from "../generated/prisma/enums.js";

export const assessmentRepository = {
  create: (data: {
    userId: string;
    energyScore: number;
    scenario: Scenario;
    answers: readonly EnergyLevel[];
  }) =>
    prisma.assessment.create({
      data: {
        userId: data.userId,
        energyScore: data.energyScore,
        scenario: data.scenario,
        answers: {
          create: data.answers.map((level, questionIndex) => ({
            questionIndex,
            level,
          })),
        },
      },
      select: { id: true, energyScore: true, scenario: true, createdAt: true },
    }),

  findLatest: (userId: string) =>
    prisma.assessment.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, energyScore: true, scenario: true, createdAt: true },
    }),

  findRecent: (userId: string, take: number) =>
    prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, energyScore: true, scenario: true, createdAt: true },
    }),
};
