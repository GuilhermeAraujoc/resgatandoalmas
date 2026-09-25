import type { Prisma } from "../generated/db/client.js";
import { prisma } from "../lib/prisma.js";
import type { Ease, EnergyLevel, Feeling } from "../generated/db/enums.js";

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
    select: { activityId: true, activitySnapshot: true, contentReleaseId: true, activity: { select: { name: true } } },
  },
} as const;

export const feedbackRepository = {
  /** Records the completed activity and its feedback atomically. */
  createWithCompletion: (data: {
    userId: string;
    activityId: string;
    contentReleaseId: string;
    activitySnapshot: Prisma.InputJsonValue;
    energyLevel: EnergyLevel;
    feeling: Feeling;
    ease: Ease;
    hadDiscomfort: boolean;
    note: string | null;
    energyBefore: number | null;
  }) => {
    const { userId, activityId, contentReleaseId, activitySnapshot, ...feedback } = data;
    return prisma.userActivity
      .create({
        data: {
          userId,
          activityId,
          contentReleaseId,
          activitySnapshot,
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

  findEnergySince: (userId: string, since: Date) =>
    prisma.feedback.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { id: true, energyLevel: true, createdAt: true },
    }),
};
