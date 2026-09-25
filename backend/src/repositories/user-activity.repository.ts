import { prisma } from "../lib/prisma.js";

export const userActivityRepository = {
  count: (userId: string) => prisma.userActivity.count({ where: { userId } }),

  /** Distinct activity ids completed since `since` (all time when null). */
  async completedActivityIds(userId: string, since: Date | null) {
    const rows = await prisma.userActivity.findMany({
      where: { userId, ...(since ? { completedAt: { gte: since } } : {}) },
      distinct: ["activityId"],
      select: { activityId: true },
    });
    return rows.map((row) => row.activityId);
  },

  completionDates: (userId: string, since: Date) =>
    prisma.userActivity.findMany({
      where: { userId, completedAt: { gte: since } },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    }),

  findRecent: (userId: string, take: number) =>
    prisma.userActivity.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take,
      select: {
        id: true,
        activityId: true,
        activitySnapshot: true,
        completedAt: true,
        activity: { select: { name: true } },
      },
    }),
};
