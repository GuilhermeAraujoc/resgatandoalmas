import { contentService, visibleCatalog } from "./content.service.js";
import { env } from "../config/env.js";
import { assessmentRepository } from "../repositories/assessment.repository.js";
import { feedbackRepository } from "../repositories/feedback.repository.js";
import { userActivityRepository } from "../repositories/user-activity.repository.js";
import { feedbackEnergy } from "../domain/energy.js";
import { addDays, dayKey, weekKeys } from "../lib/dates.js";

/** How many recent assessments/feedbacks/activities the progress payload lists. */
const RECENT_LIMIT = 50;
/** Covers the current calendar year/week in any client timezone and the streak. */
const HISTORY_WINDOW_DAYS = 400;

interface EnergyRecord {
  id: string;
  date: string;
  value: number;
  kind: "assessment" | "feedback";
}

export const progressService = {
  /** Energy value of the user's most recent assessment or feedback. */
  async latestEnergy(userId: string): Promise<number | null> {
    const [assessment, feedback] = await Promise.all([
      assessmentRepository.findLatest(userId),
      feedbackRepository.findLatest(userId),
    ]);
    if (feedback && (!assessment || feedback.createdAt > assessment.createdAt))
      return feedbackEnergy(feedback.energyLevel);
    return assessment?.energyScore ?? null;
  },

  async getProgress(userId: string) {
    const tz = env.APP_TIMEZONE;
    const today = dayKey(new Date(), tz);
    const week = weekKeys(today);
    const since = new Date(Date.now() - HISTORY_WINDOW_DAYS * 86_400_000);

    const [
      latestAssessment,
      assessments,
      feedbacks,
      activities,
      totalCompleted,
      completions,
      chartAssessments,
      chartFeedbacks,
    ] = await Promise.all([
      assessmentRepository.findLatest(userId),
      assessmentRepository.findRecent(userId, RECENT_LIMIT),
      feedbackRepository.findRecent(userId, RECENT_LIMIT),
      userActivityRepository.findRecent(userId, RECENT_LIMIT),
      userActivityRepository.count(userId),
      userActivityRepository.completionDates(userId, since),
      assessmentRepository.findEnergySince(userId, since),
      feedbackRepository.findEnergySince(userId, since),
    ]);
    // The protocol restarts with every assessment, so only later completions count.
    const completedActivityIds = await userActivityRepository.completedActivityIds(
      userId,
      latestAssessment?.createdAt ?? null,
    );

    const energyRecords: EnergyRecord[] = [
      ...[...assessments, ...chartAssessments].map((a) => ({
        id: a.id,
        date: a.createdAt.toISOString(),
        value: a.energyScore,
        kind: "assessment" as const,
      })),
      ...[...feedbacks, ...chartFeedbacks].map((f) => ({
        id: f.id,
        date: f.createdAt.toISOString(),
        value: feedbackEnergy(f.energyLevel),
        kind: "feedback" as const,
      })),
    ];
    // Recent records preserve the latest value for inactive users; the time window
    // includes every chart record even when users submit more than 50 per year.
    const history = [
      ...new Map(
        energyRecords.map((record) => [`${record.kind}:${record.id}`, record]),
      ).values(),
    ].sort((a, b) => a.date.localeCompare(b.date));

    const lastValueByDay = new Map<string, number>();
    for (const record of history)
      lastValueByDay.set(dayKey(new Date(record.date), tz), record.value);

    const completionDays = completions.map((c) => dayKey(c.completedAt, tz));
    const activeDays = new Set(completionDays);
    let streakDays = 0;
    let day = activeDays.has(today) ? today : addDays(today, -1);
    while (activeDays.has(day)) {
      streakDays++;
      day = addDays(day, -1);
    }

    const protocolCatalog = latestAssessment?.contentReleaseId ? visibleCatalog(await contentService.get(latestAssessment.contentReleaseId)) : null;
    return {
      protocolCatalog,
      currentEnergy: history.at(-1)?.value ?? null,
      scenario: latestAssessment?.scenario ?? null,
      lastAssessmentAt: latestAssessment?.createdAt.toISOString() ?? null,
      completedActivityIds,
      summary: {
        totalCompleted,
        completedThisWeek: completionDays.filter((d) => week.includes(d)).length,
        /** Monday…Sunday. */
        activeDaysThisWeek: week.map((d) => activeDays.has(d)),
        streakDays,
      },
      /** Last energy value of each day, Monday…Sunday; null when none. */
      weeklyEnergy: week.map((d) => lastValueByDay.get(d) ?? null),
      history,
      activities: activities.map((a) => ({
        id: a.id,
        activityId: a.activityId,
        name: (a.activitySnapshot as { name?: string } | null)?.name ?? a.activity.name,
        completedAt: a.completedAt.toISOString(),
      })),
      feedbacks: feedbacks.map((f) => ({
        id: f.id,
        activityId: f.userActivity.activityId,
        activityName: (f.userActivity.activitySnapshot as { name?: string } | null)?.name ?? f.userActivity.activity.name,
        energyLevel: f.energyLevel,
        feeling: f.feeling,
        ease: f.ease,
        hadDiscomfort: f.hadDiscomfort,
        note: f.note,
        before: f.energyBefore,
        after: feedbackEnergy(f.energyLevel),
        createdAt: f.createdAt.toISOString(),
      })),
    };
  },
};
