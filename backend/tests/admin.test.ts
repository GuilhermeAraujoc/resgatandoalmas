import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import bcrypt from "bcryptjs";

// This suite only runs against an explicitly named disposable test database.
const testUrl = process.env.ADMIN_TEST_DATABASE_URL;
const enabled = Boolean(testUrl && new URL(testUrl).pathname.startsWith("/resgatando_admin_test_"));
if (testUrl && !enabled) throw new Error("Refusing to run integration tests outside resgatando_admin_test_*.");
let server: Server;
let base = "";
let prisma: typeof import("../src/lib/prisma.js").prisma;
let adminId = "";
let userId = "";
let adminCookie = "";
let userCookie = "";
const password = "Test-only-password-482!";

async function api(path: string, method = "GET", body?: unknown, cookie = adminCookie, customHeader = true) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(customHeader ? { "X-Requested-With": "ResgatandoAlmas" } : {}) };
  const response = await fetch(`${base}${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = response.status === 204 ? null : await response.json();
  return { response, data };
}
async function login(email: string) {
  const result = await api("/auth/login", "POST", { email, password }, "");
  assert.equal(result.response.status, 200);
  return result.response.headers.get("set-cookie")!.split(";")[0]!;
}
before(async () => {
  if (!enabled) return;
  process.env.DATABASE_URL = testUrl!;
  process.env.NODE_ENV = "test";
  ({ prisma } = await import("../src/lib/prisma.js"));
  // Cleanup is restricted by the test database name check above.
  await prisma.user.deleteMany(); await prisma.adminAudit.deleteMany();
  await prisma.contentDraft.deleteMany(); await prisma.contentRelease.deleteMany();
  const { activities } = await import("../prisma/activities.js");
  for (const activity of activities) await prisma.activity.upsert({ where: { id: activity.id }, create: activity, update: {} });
  const { initializeContent } = await import("../prisma/content.js");
  await initializeContent();
  const passwordHash = await bcrypt.hash(password, 4);
  const admin = await prisma.user.create({ data: { email: "admin@test.invalid", name: "Admin teste", role: "ADMIN", passwordHash, termsAcceptedAt: new Date() } });
  const user = await prisma.user.create({ data: { email: "user@test.invalid", name: "Usuário teste", cpf: "52998224725", passwordHash, termsAcceptedAt: new Date() } });
  adminId = admin.id; userId = user.id;
  const { app } = await import("../src/app.js");
  server = await new Promise<Server>(resolve => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test server address");
  base = `http://127.0.0.1:${address.port}/api`;
  adminCookie = await login("admin@test.invalid"); userCookie = await login("user@test.invalid");
});
after(async () => {
  if (!enabled) return;
  if (server) { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
  await prisma?.$disconnect();
});

test("admin authorization, immutable history, drafts, blocking and confirmed deletion", { skip: !enabled }, async t => {
  let original: any;
  let published: any;
  await t.test("anonymous and regular accounts cannot access any admin area", async () => {
    for (const path of ["/admin/stats", "/admin/users", "/admin/content", "/admin/audit", `/admin/users/${userId}/report`, `/admin/users/${userId}/export`]) {
      assert.equal((await api(path, "GET", undefined, "")).response.status, 401);
      assert.equal((await api(path, "GET", undefined, userCookie)).response.status, 403);
    }
    assert.equal((await api("/admin/content", "PATCH", {}, userCookie)).response.status, 403);
    assert.equal((await api("/admin/content", "PATCH", {}, adminCookie, false)).response.status, 403);
    assert.equal((await api("/me", "PATCH", { role: "ADMIN" }, userCookie)).response.status, 400);
    assert.equal((await api("/auth/register", "POST", { name: "Escalation", email: "attacker@test.invalid", cpf: "11144477735", password, acceptedTerms: true, role: "ADMIN" }, "")).response.status, 400);
    await prisma.user.update({ where: { id: adminId }, data: { role: "USER" } });
    assert.equal((await api("/admin/users")).response.status, 403);
    await prisma.user.update({ where: { id: adminId }, data: { role: "ADMIN" } });
  });
  await t.test("published questionnaires compute scores on the server and snapshot answers", async () => {
    original = (await api("/catalog", "GET", undefined, userCookie)).data;
    const answers = original.questions.filter((q: any) => q.active).map((q: any) => ({ questionId: q.id, optionIndex: 2 }));
    const invalid = await api("/assessments", "POST", { contentReleaseId: original.id, answers: [...answers, answers[0]] }, userCookie);
    assert.equal(invalid.response.status, 400);
    const result = await api("/assessments", "POST", { contentReleaseId: original.id, answers }, userCookie);
    assert.equal(result.response.status, 201);
    assert.equal(result.data.assessment.energyScore, 50);
    const feedback = await api("/feedbacks", "POST", { contentReleaseId: original.id, activityId: original.exercises[0].id, energyLevel: "ALTO", feeling: "BEM", ease: "FACIL", hadDiscomfort: false, note: '=HYPERLINK("https://example.invalid")' }, userCookie);
    assert.equal(feedback.response.status, 201);
  });
  await t.test("drafts stay private, publication uses optimistic locking, historical versions stay unchanged", async () => {
    const initial = (await api("/admin/content")).data.draft;
    const data = structuredClone(initial.data);
    data.exercises[0].name = "Exercício revisado";
    data.questions[0].text = "Pergunta revisada";
    data.questions[0].options[2].score = 100;
    data.questions[0].options[4].active = false;
    data.questions[0].options.push({ label: "Outra alternativa", score: 90, active: true });
    const saved = await api("/admin/content", "PATCH", { revision: initial.revision, data });
    assert.equal(saved.response.status, 200);
    assert.equal((await api("/catalog", "GET", undefined, userCookie)).data.id, original.id);
    assert.equal((await api("/admin/content", "PATCH", { revision: initial.revision, data })).response.status, 409);
    assert.equal((await api("/admin/content/publish", "POST", { revision: initial.revision })).response.status, 409);
    published = await api("/admin/content/publish", "POST", { revision: saved.data.draft.revision });
    assert.equal(published.response.status, 201);
    const current = (await api("/catalog", "GET", undefined, userCookie)).data;
    const inactiveAnswers = current.questions.map((q: any, i: number) => ({ questionId: q.id, optionIndex: i === 0 ? 4 : 2 }));
    assert.equal((await api("/assessments", "POST", { contentReleaseId: current.id, answers: inactiveAnswers }, userCookie)).response.status, 400);
    assert.equal(current.questions[0].options[4].label, "Indisponível");
    assert.notEqual(current.id, original.id);
    assert.equal(current.exercises[0].name, "Exercício revisado");
    const report = (await api(`/admin/users/${userId}/report`)).data;
    assert.equal(report.assessments[0].energyScore, 50);
    assert.equal(report.assessments[0].answerSnapshot[0].question, original.questions[0].text);
    assert.equal(report.activities[0].name, original.exercises[0].name);
    const progress = (await api("/me/progress", "GET", undefined, userCookie)).data;
    assert.equal(progress.protocolCatalog.id, original.id);
    const csv = (await api(`/admin/users/${userId}/export`)).data.csv;
    assert.ok(csv.includes("'=HYPERLINK"));
    const stored = await prisma.contentRelease.findUniqueOrThrow({ where: { id: original.id } });
    assert.equal((stored.data as any).questions[0].text, original.questions[0].text);
  });
  await t.test("invalid publication remains a draft and archived alternatives cannot be submitted", async () => {
    const initial = (await api("/admin/content")).data.draft;
    const data = structuredClone(initial.data);
    data.questions.forEach((question: any) => { question.active = false; });
    const saved = await api("/admin/content", "PATCH", { revision: initial.revision, data });
    assert.equal(saved.response.status, 200);
    assert.equal((await api("/admin/content/publish", "POST", { revision: saved.data.draft.revision })).response.status, 400);
    assert.equal((await api("/catalog")).data.id, published.data.release.id);
    const restored = await api("/admin/content", "PATCH", { revision: saved.data.draft.revision, data: initial.data });
    assert.equal(restored.response.status, 200);
    const current = (await api("/catalog", "GET", undefined, userCookie)).data;
    const answers = current.questions.map((q: any, i: number) => ({ questionId: q.id, optionIndex: i === 0 ? 5 : 2 }));
    const result = await api("/assessments", "POST", { contentReleaseId: current.id, answers }, userCookie);
    assert.equal(result.response.status, 201);
    assert.equal(result.data.assessment.energyScore, 53);
    const stored = await prisma.assessmentAnswer.findFirstOrThrow({ where: { assessmentId: result.data.assessment.id, questionIndex: 0 } });
    assert.equal(stored.selectedOptionIndex, 5);
    assert.equal(stored.level, null);
  });
  await t.test("reports are paginated, date ranges validated, and stats exclude administrator accounts", async () => {
    const list = await api("/admin/users?q=Usuário");
    assert.equal(list.data.total, 1);
    assert.equal(list.data.users[0].passwordHash, undefined);
    assert.equal((await api("/admin/stats?from=2026-09-25&to=2026-01-01")).response.status, 400);
    const stats = await api("/admin/stats");
    assert.equal(stats.data.totalUsers, 1);
    assert.equal(stats.data.assessments, 2);
    assert.equal(stats.data.completed, 1);
    await prisma.assessment.createMany({ data: Array.from({ length: 26 }, () => ({ userId, energyScore: 60, scenario: "VITALITY" as const, contentReleaseId: original.id })) });
    const first = (await api(`/admin/users/${userId}/report`)).data;
    const second = (await api(`/admin/users/${userId}/report?page=2`)).data;
    assert.equal(first.assessments.length, 25);
    assert.equal(second.assessments.length, 3);
    assert.equal(first.counts.assessments, 28);
    assert.equal(first.pages, 2);
    assert.equal((await api(`/admin/users/${userId}/report?userId=${adminId}`)).response.status, 400);
  });
  await t.test("blocking revokes sessions, updates reject stale revisions, admins cannot be altered", async () => {
    const user = (await api(`/admin/users/${userId}/report`)).data.user;
    const input = { name: user.name, email: user.email, cpf: user.cpf, phone: "", birthDate: "", blocked: true, updatedAt: user.updatedAt, reason: "Bloqueio de teste" };
    const updated = await api(`/admin/users/${userId}`, "PATCH", input);
    assert.equal(updated.response.status, 200);
    assert.equal((await api("/me", "GET", undefined, userCookie)).response.status, 401);
    assert.equal((await api("/auth/login", "POST", { email: user.email, password }, "")).response.status, 401);
    assert.equal((await api(`/admin/users/${userId}`, "PATCH", input)).response.status, 409);
    assert.equal((await api(`/admin/users/${adminId}`, "PATCH", input)).response.status, 403);
    assert.equal((await api("/me", "DELETE")).response.status, 403);
    assert.equal((await api(`/admin/users/${userId}`, "PATCH", { ...input, blocked: false, updatedAt: updated.data.user.updatedAt })).response.status, 200);
    userCookie = await login(user.email);
    assert.equal((await api("/me", "GET", undefined, userCookie)).response.status, 200);
  });
  await t.test("deletion requires administrator password and confirmation; audit and versions survive", async () => {
    const user = (await api(`/admin/users/${userId}/report`)).data.user;
    const input = { confirmation: "EXCLUIR", currentPassword: password, reason: "Exclusão de teste", updatedAt: user.updatedAt };
    assert.equal((await api(`/admin/users/${userId}`, "DELETE", { ...input, confirmation: "sim" })).response.status, 400);
    assert.equal((await api(`/admin/users/${userId}`, "DELETE", { ...input, currentPassword: "wrong" })).response.status, 403);
    assert.equal((await api(`/admin/users/${adminId}`, "DELETE", input)).response.status, 403);
    assert.equal((await api(`/admin/users/${userId}`, "DELETE", input)).response.status, 204);
    assert.equal(await prisma.user.findUnique({ where: { id: userId } }), null);
    assert.equal(await prisma.assessment.count({ where: { userId } }), 0);
    assert.equal(await prisma.feedback.count({ where: { userId } }), 0);
    assert.equal((await api("/me", "GET", undefined, userCookie)).response.status, 401);
    assert.ok(await prisma.contentRelease.findUnique({ where: { id: original.id } }));
    const logs = await prisma.adminAudit.findMany();
    assert.ok(logs.some(log => log.action === "USER_DELETED" && log.targetId === userId));
    assert.ok(logs.some(log => log.action === "CONTENT_PUBLISHED"));
    assert.ok(!JSON.stringify(logs).includes(password));
    assert.ok(!JSON.stringify(logs).includes("passwordHash"));
  });
});
