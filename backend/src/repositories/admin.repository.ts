import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/db/client.js";
import type { DateRange } from "../validation/admin.schemas.js";
import { forbidden, conflict, notFound } from "../lib/errors.js";

const userSelect = { id: true, name: true, email: true, cpf: true, phone: true, birthDate: true, role: true, blockedAt: true, createdAt: true, updatedAt: true, lastLoginAt: true } as const;
const rangeWhere = (range: DateRange) => ({ gte: range.start, lt: range.end });
const audit = (actorId: string, action: string, targetId: string | null, reason: string | null, fields: string[] = []) => ({ actorId, action, targetId, reason, fields });
async function guardActor(tx: Prisma.TransactionClient, id: string) {
  if (!await tx.user.findFirst({ where: { id, role: "ADMIN", blockedAt: null }, select: { id: true } })) throw forbidden();
}

export const adminRepository = {
  credentials: (id: string) => prisma.user.findUnique({ where: { id }, select: { passwordHash: true, role: true, blockedAt: true } }),
  async list(input: { q: string; page: number; status: string }) {
    const where: Prisma.UserWhereInput = {
      ...(input.status === "active" ? { blockedAt: null } : input.status === "blocked" ? { blockedAt: { not: null } } : {}),
      ...(input.q ? { OR: [{ name: { contains: input.q, mode: "insensitive" } }, { email: { contains: input.q, mode: "insensitive" } }] } : {}),
    };
    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, select: userSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 25, skip: (input.page - 1) * 25 }),
    ]);
    return { users, total, page: input.page, pages: Math.max(1, Math.ceil(total / 25)) };
  },
  async stats(range: DateRange) {
    const time = rangeWhere(range);
    const [totalUsers, blockedUsers, newUsers, activeUsers, assessments, completed, discomfort, scores] = await prisma.$transaction([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "USER", blockedAt: { not: null } } }),
      prisma.user.count({ where: { role: "USER", createdAt: time } }),
      prisma.user.count({ where: { role: "USER", OR: [{ assessments: { some: { createdAt: time } } }, { activities: { some: { completedAt: time } } }] } }),
      prisma.assessment.count({ where: { createdAt: time, user: { role: "USER" } } }),
      prisma.userActivity.count({ where: { completedAt: time, user: { role: "USER" } } }),
      prisma.feedback.count({ where: { createdAt: time, hadDiscomfort: true, user: { role: "USER" } } }),
      prisma.assessment.aggregate({ where: { createdAt: time, user: { role: "USER" } }, _avg: { energyScore: true } }),
    ]);
    return { totalUsers, blockedUsers, newUsers, activeUsers, assessments, completed, discomfort, averageEnergy: scores._avg.energyScore };
  },
  async report(actorId: string, userId: string, range: DateRange, exporting = false) {
    return prisma.$transaction(async tx => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: userSelect });
      if (!user) throw notFound("Usuário não encontrado.");
      const where = { userId, createdAt: rangeWhere(range) };
      const activityWhere = { userId, completedAt: rangeWhere(range) };
      const [assessmentCount, feedbackCount, activityCount] = await Promise.all([
        tx.assessment.count({ where }), tx.feedback.count({ where }), tx.userActivity.count({ where: activityWhere }),
      ]);
      if (exporting && assessmentCount + feedbackCount + activityCount > 5000) throw conflict("Reduza o período para exportar no máximo 5000 registros.");
      const paging: { take?: number; skip?: number } = exporting ? {} : { take: 25, skip: (range.page - 1) * 25 };
      const [assessments, feedbacks, activities] = await Promise.all([
        tx.assessment.findMany({ where, ...paging, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, createdAt: true, energyScore: true, scenario: true, answerSnapshot: true, contentRelease: { select: { version: true, data: true } } } }),
        tx.feedback.findMany({ where, ...paging, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, createdAt: true, energyLevel: true, feeling: true, ease: true, hadDiscomfort: true, note: true, energyBefore: true, userActivity: { select: { activitySnapshot: true, activity: { select: { name: true } } } } } }),
        tx.userActivity.findMany({ where: activityWhere, ...paging, orderBy: [{ completedAt: "desc" }, { id: "desc" }], select: { id: true, completedAt: true, activitySnapshot: true, activity: { select: { name: true } }, contentRelease: { select: { version: true } } } }),
      ]);
      const [energyAssessments, energyFeedbacks] = await Promise.all([
        tx.assessment.findMany({ where, select: { createdAt: true, energyScore: true }, orderBy: { createdAt: "desc" }, take: 5000 }),
        tx.feedback.findMany({ where, select: { createdAt: true, energyLevel: true }, orderBy: { createdAt: "desc" }, take: 5000 }),
      ]);
      await tx.adminAudit.create({ data: audit(actorId, exporting ? "USER_REPORT_EXPORTED" : "USER_REPORT_VIEWED", userId, null) });
      return { user, assessments, feedbacks, activities, energyAssessments, energyFeedbacks, historyTruncated: assessmentCount > 5000 || feedbackCount > 5000, counts: { assessments: assessmentCount, feedbacks: feedbackCount, activities: activityCount }, page: range.page, pages: Math.max(1, Math.ceil(Math.max(assessmentCount, feedbackCount, activityCount) / 25)) };
    });
  },
  async update(actorId: string, userId: string, updatedAt: string, reason: string, data: { name: string; email: string; cpf: string; phone: string | null; birthDate: Date | null; blockedAt: Date | null }) {
    return prisma.$transaction(async tx => {
      await guardActor(tx, actorId);
      const target = await tx.user.findUnique({ where: { id: userId } });
      if (!target) throw notFound();
      if (target.role === "ADMIN" || target.id === actorId) throw forbidden("Contas administrativas são gerenciadas pelo operador do sistema.");
      const changed = await tx.user.updateMany({ where: { id: userId, role: "USER", updatedAt: new Date(updatedAt) }, data });
      if (!changed.count) throw conflict("O cadastro mudou. Recarregue antes de salvar.");
      // Blocking or changing identity immediately revokes existing sessions.
      if (data.blockedAt || data.email !== target.email || data.cpf !== target.cpf)
        await tx.session.deleteMany({ where: { userId } });
      const fields = Object.keys(data).filter(key => String(data[key as keyof typeof data]) !== String(target[key as keyof typeof data]));
      await tx.adminAudit.create({ data: audit(actorId, "USER_UPDATED", userId, reason, fields) });
      return tx.user.findUniqueOrThrow({ where: { id: userId }, select: userSelect });
    });
  },
  async remove(actorId: string, userId: string, updatedAt: string, reason: string) {
    return prisma.$transaction(async tx => {
      await guardActor(tx, actorId);
      const target = await tx.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!target) throw notFound();
      if (target.role === "ADMIN" || userId === actorId) throw forbidden("Não é permitido excluir uma conta administrativa pelo painel.");
      const deleted = await tx.user.deleteMany({ where: { id: userId, role: "USER", updatedAt: new Date(updatedAt) } });
      if (!deleted.count) throw conflict("O cadastro mudou. Recarregue antes de excluir.");
      await tx.adminAudit.create({ data: audit(actorId, "USER_DELETED", userId, reason) });
    });
  },
  async audits(page: number) {
    const [total, entries] = await prisma.$transaction([
      prisma.adminAudit.count(),
      prisma.adminAudit.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 25, skip: (page - 1) * 25 }),
    ]);
    return { entries, total, page, pages: Math.max(1, Math.ceil(total / 25)) };
  },
};
