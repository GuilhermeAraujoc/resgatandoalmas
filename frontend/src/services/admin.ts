import { request } from "./api";
import type { CatalogData, EnergyRecord } from "../types";
export interface AdminUser {
  id: string; name: string; email: string; cpf: string | null; phone: string | null;
  birthDate: string | null; role: "USER" | "ADMIN"; blockedAt: string | null;
  createdAt: string; updatedAt: string; lastLoginAt: string | null;
}
export interface UserList { users: AdminUser[]; total: number; page: number; pages: number }
export interface AdminStats {
  totalUsers: number; blockedUsers: number; newUsers: number; activeUsers: number;
  assessments: number; completed: number; discomfort: number; averageEnergy: number | null;
}
export interface UserReport {
  energyHistory: EnergyRecord[];
  historyTruncated: boolean;
  user: AdminUser;
  assessments: { id: string; createdAt: string; energyScore: number; scenario: string; version: number | null;
    answerSnapshot: { question: string; label: string; score: number | null }[] | null;
    protocol: { name: string; exercises: string[] } | null }[];
  activities: { id: string; completedAt: string; name: string; version: number | null; snapshot: { steps?: string[]; desc?: string } | null }[];
  feedbacks: { id: string; createdAt: string; activityName: string; after: number; energyBefore: number | null; feeling: string; ease: string; hadDiscomfort: boolean; note: string | null }[];
  counts: { assessments: number; feedbacks: number; activities: number };
  page: number; pages: number;
}
export interface ContentDraft { revision: number; data: CatalogData; updatedAt: string }
export interface ContentResponse { draft: ContentDraft | null; releases: { id: string; version: number; createdAt: string }[] }
export interface AuditResponse { entries: { id: string; actorId: string; action: string; targetId: string | null; reason: string | null; fields: string[]; createdAt: string }[]; page: number; pages: number; total: number }
export const adminRequest = <T>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: unknown) => request<T>(method, `/admin${path}`, body);
export async function downloadReport(userId: string, query: string) {
  const file = await adminRequest<{ filename: string; csv: string }>("GET", `/users/${encodeURIComponent(userId)}/export?${query}`);
  const url = URL.createObjectURL(new Blob([file.csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = file.filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
