import { config } from "../config";
import type { UserSnapshot, Profile } from "../types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export async function request(path: string, method = "GET", body?: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}${path}`, {
      method,
      signal: AbortSignal.timeout(15000),
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Tente novamente.", 0);
  }
  if (!response.ok) {
    throw new ApiError(response.status === 401
      ? "Sessão expirada ou credenciais inválidas. Entre novamente."
      : response.status === 404
        ? "Este serviço ainda não está disponível."
        : "Não foi possível concluir a solicitação. Tente novamente.", response.status);
  }
  if (response.status === 204) return undefined;
  try { return await response.json(); }
  catch { throw new ApiError("O servidor retornou uma resposta inválida.", response.status); }
}

export function readProfile(value: unknown): Profile {
  if (!value || typeof value !== "object") throw new Error("Perfil inválido recebido do servidor.");
  const profile = value as Record<string, unknown>;
  if (!["name", "email", "phone", "birth"].every(key => typeof profile[key] === "string")) {
    throw new Error("Perfil inválido recebido do servidor.");
  }
  return profile as unknown as Profile;
}

export function readState(value: unknown): UserSnapshot {
  if (!value || typeof value !== "object") throw new Error("Dados inválidos recebidos do servidor.");
  const state = value as UserSnapshot;
  readProfile(state.profile);
  const energy = (v: unknown) => v === null || (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100);
  const date = (v: unknown) => typeof v === "string" && Number.isFinite(Date.parse(v));
  if (!energy(state.energy) || !energy(state.before) ||
      ![null, "calm", "vitality"].includes(state.scenario) ||
      !Array.isArray(state.completed) || !state.completed.every(id => typeof id === "string") ||
      typeof state.currentExerciseId !== "string" ||
      !Array.isArray(state.history) || !state.history.every(r => r && typeof r.id === "string" && date(r.date) && r.value !== null && energy(r.value) && ["assessment", "feedback"].includes(r.kind)) ||
      !Array.isArray(state.feedbackHistory) || !state.feedbackHistory.every(r => r && typeof r.exerciseId === "string" && date(r.date) && energy(r.before) && typeof r.after === "number" && energy(r.after) && typeof r.note === "string" && ["energy", "feeling", "ease", "pain"].every(key => { const value = r[key as keyof typeof r]; return value === undefined || (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= (key === "pain" ? 1 : 4)); }))) {
    throw new Error("Dados inválidos recebidos do servidor.");
  }
  return state;
}
