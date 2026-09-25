import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/db/client.js";

export const userRepository = {
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),

  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),

  /** Whether another user already uses this e-mail or CPF. */
  async findConflicts(
    { email, cpf }: { email?: string; cpf?: string },
    exceptUserId?: string,
  ) {
    const or: Prisma.UserWhereInput[] = [];
    if (email) or.push({ email });
    if (cpf) or.push({ cpf });
    if (or.length === 0) return [];
    return prisma.user.findMany({
      where: {
        OR: or,
        ...(exceptUserId ? { id: { not: exceptUserId } } : {}),
      },
      select: { email: true, cpf: true },
    });
  },

  create: (data: Prisma.UserCreateInput) => prisma.user.create({ data }),

  update: (id: string, data: Prisma.UserUpdateInput) =>
    prisma.user.update({ where: { id }, data }),

  /** Sessions, assessments, activities and feedbacks cascade. */
  delete: (id: string) => prisma.user.deleteMany({ where: { id } }),
};
