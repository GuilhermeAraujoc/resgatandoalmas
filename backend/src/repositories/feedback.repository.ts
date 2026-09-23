import { prisma } from "../lib/prisma.js";
import type { Ease, EnergyLevel, Feeling } from "../generated/prisma/enums.js";

const feedbackSelect = {
  id: true,
  energyLevel: true,
  feeling: true,
  ease: true,
  hadDiscomfort: true,
  note: true,
  energyBefore: true,
  createdAt: true,
  userActivity: {
    select: { activityId: true, activity: { select: { name: true } } },
  },
} as const;

export const feedbackRepository = {
  /** Records the completed activity and its feedback atomically. */
  createWithCompletion: (data: {
    userId: string;
    activityId: string;
    energyLevel: EnergyLevel;
    feeling: Feeling;
    ease: Ease;
    hadDiscomfort: boolean;
    note: string | null;
    energyBefore: number | null;
  }) => {
    const { userId, activityId, ...feedback } = data;
    return prisma.userActivity
      .create({
        data: {
          userId,
          activityId,
          feedback: { create: { userId, ...feedback } },
        },
        select: { feedback: { select: feedbackSelect } },
      })
      .then(({ feedback }) => feedback!);
  },

  findLatest: (userId: string) =>
    prisma.feedback.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { energyLevel: true, createdAt: true },
    }),

  findRecent: (userId: string, take: number) =>
    prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: feedbackSelect,
    }),
};
