import { prisma } from "../lib/prisma.js";

export const activityRepository = {
  findById: (id: string) =>
    prisma.activity.findUnique({ where: { id }, select: { id: true } }),
};
