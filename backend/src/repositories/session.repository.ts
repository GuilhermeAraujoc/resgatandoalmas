import { prisma } from "../lib/prisma.js";

export const sessionRepository = {
  create: (data: { tokenHash: string; userId: string; expiresAt: Date }) =>
    prisma.session.create({ data }),

  findActive: (tokenHash: string) =>
    prisma.session.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() }, user: { blockedAt: null } },
      select: { id: true, userId: true, user: { select: { role: true } } },
    }),

  deleteByTokenHash: (tokenHash: string) =>
    prisma.session.deleteMany({ where: { tokenHash } }),

  deleteExpired: (userId: string) =>
    prisma.session.deleteMany({
      where: { userId, expiresAt: { lte: new Date() } },
    }),
};
