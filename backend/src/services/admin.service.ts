import bcrypt from "bcryptjs";
import { adminRepository } from "../repositories/admin.repository.js";
import { forbidden } from "../lib/errors.js";
import { catalogSchema } from "../validation/content.schemas.js";
import { feedbackEnergy } from "../domain/energy.js";
import type { DateRange } from "../validation/admin.schemas.js";

/** Neutralize spreadsheet formulas as well as quote/newline delimiters. */
export function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export const adminService = {
  async confirmPassword(actorId: string, password: string) {
    const actor = await adminRepository.credentials(actorId);
    if (!actor || actor.role !== "ADMIN" || actor.blockedAt || !await bcrypt.compare(password, actor.passwordHash))
      throw forbidden("Confirme sua senha de administrador para excluir a conta.");
  },
  async report(actorId: string, userId: string, range: DateRange, exporting = false) {
    const result = await adminRepository.report(actorId, userId, range, exporting);
    const days = new Map<string, { sum: number; count: number }>();
    for (const entry of [...result.energyAssessments.map(a => ({ date: a.createdAt, value: a.energyScore })), ...result.energyFeedbacks.map(f => ({ date: f.createdAt, value: feedbackEnergy(f.energyLevel) }))]) {
      const day = entry.date.toISOString().slice(0, 10);
      const values = days.get(day) ?? { sum: 0, count: 0 };
      values.sum += entry.value; values.count++;
      days.set(day, values);
    }
    const { energyAssessments: _a, energyFeedbacks: _f, ...report } = result;
    return {
      ...report,
      energyHistory: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([day, value]) => ({ id: day, date: `${day}T12:00:00Z`, value: value.sum / value.count, kind: "assessment" as const })),
      assessments: result.assessments.map(({ contentRelease, ...assessment }) => {
        const catalog = contentRelease ? catalogSchema.parse(contentRelease.data) : null;
        const protocol = catalog?.protocols[assessment.scenario === "CALM" ? "calm" : "vitality"];
        return { ...assessment, version: contentRelease?.version ?? null,
          protocol: protocol ? { name: protocol.name, exercises: protocol.exerciseIds.map(id => catalog!.exercises.find(exercise => exercise.id === id)?.name ?? id) } : null };
      }),
      activities: result.activities.map(({ activity, activitySnapshot, contentRelease, ...entry }) => ({ ...entry, name: (activitySnapshot as { name?: string } | null)?.name ?? activity.name, snapshot: activitySnapshot, version: contentRelease?.version ?? null })),
      feedbacks: result.feedbacks.map(({ userActivity, ...entry }) => ({ ...entry, after: feedbackEnergy(entry.energyLevel), activityName: (userActivity.activitySnapshot as { name?: string } | null)?.name ?? userActivity.activity.name })),
    };
  },
  async export(actorId: string, userId: string, range: DateRange) {
    const report = await this.report(actorId, userId, range, true);
    const rows: unknown[][] = [["Tipo", "Data UTC", "Energia", "Conteúdo", "Versão", "Observação"]];
    for (const item of report.assessments) rows.push(["Avaliação", item.createdAt.toISOString(), item.energyScore, item.protocol?.name, item.version, ""]);
    for (const item of report.activities) rows.push(["Exercício concluído", item.completedAt.toISOString(), "", item.name, item.version, ""]);
    for (const item of report.feedbacks) rows.push(["Feedback", item.createdAt.toISOString(), item.after, item.activityName, "", item.note]);
    return { filename: `relatorio-${userId}-${range.start.toISOString().slice(0, 10)}.csv`, csv: '\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n') };
  },
};
