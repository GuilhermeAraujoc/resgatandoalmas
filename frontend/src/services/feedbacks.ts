import { request } from "./api";
import { apiEases, apiEnergyLevels, apiFeelings, type FeedbackDto } from "./dto";
import type { Feedback } from "../types";

/** Sends a complete feedback form; the backend also records the activity as completed. */
export async function createFeedback(activityId: string, feedback: Feedback) {
  const { feedback: saved } = await request<{ feedback: FeedbackDto }>(
    "POST",
    "/feedbacks",
    {
      activityId,
      energyLevel: apiEnergyLevels[feedback.energy!],
      feeling: apiFeelings[feedback.feeling!],
      ease: apiEases[feedback.ease!],
      // Option 0 of "Sentiu algum desconforto?" is "Sim".
      hadDiscomfort: feedback.pain === 0,
      note: feedback.note,
    },
  );
  return saved;
}
