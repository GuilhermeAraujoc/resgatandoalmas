import { prisma } from "../lib/prisma.js";

export const passwordResetRepository = {
  /** Issuing a new link invalidates the user's previous ones. */
  replace: (data: { tokenHash: string; userId: string; expiresAt: Date }) =>
    prisma.$transaction([
      prisma.passwordReset.deleteMany({ where: { userId: data.userId } }),
      prisma.passwordReset.create({ data }),
    ]),

  findActive: (tokenHash: string) =>
    prisma.passwordReset.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
        user: { blockedAt: null },
      },
      select: { id: true, userId: true },
    }),

  /**
   * Consumes the link, sets the new password and ends every session, atomically.
   * Returns false when the link was consumed concurrently.
   */
  async redeem(id: string, userId: string, passwordHash: string) {
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.passwordReset.updateMany({
        where: { id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (count === 0) return false;
      // The link arrived in the user's inbox, so it also confirms the address.
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash, emailVerified: true, verificationTokenHash: null, verificationExpiresAt: null },
      });
      await tx.session.deleteMany({ where: { userId } });
      await tx.passwordReset.deleteMany({ where: { userId, id: { not: id } } });
      return true;
    });
  },
};
