import { prisma } from "../lib/prisma.js";
import { badRequest, conflict, notFound } from "../lib/errors.js";
import { catalogSchema, validatePublication, type CatalogData } from "../validation/content.schemas.js";

export const contentRepository = {
  latest: () => prisma.contentRelease.findFirst({ orderBy: { version: "desc" } }),
  byId: (id: string) => prisma.contentRelease.findUnique({ where: { id } }),
  draft: () => prisma.contentDraft.findUnique({ where: { id: "main" } }),
  history: () => prisma.contentRelease.findMany({ orderBy: { version: "desc" }, take: 30, select: { id: true, version: true, createdAt: true } }),
  async save(actorId: string, revision: number, data: CatalogData) {
    return prisma.$transaction(async tx => {
      const result = await tx.contentDraft.updateMany({ where: { id: "main", revision }, data: { data, revision: { increment: 1 } } });
      if (!result.count) throw conflict("Outro administrador alterou o rascunho. Recarregue antes de editar.");
      await tx.adminAudit.create({ data: { actorId, action: "CONTENT_DRAFT_SAVED", targetId: String(revision + 1), fields: ["catalog"] } });
      return tx.contentDraft.findUniqueOrThrow({ where: { id: "main" } });
    });
  },
  async publish(actorId: string, revision: number) {
    return prisma.$transaction(async tx => {
      const draft = await tx.contentDraft.findUnique({ where: { id: "main" } });
      if (!draft) throw notFound("Catálogo não inicializado. Execute o seed.");
      if (draft.revision !== revision) throw conflict("O rascunho foi alterado. Recarregue e revise antes de publicar.");
      const data = catalogSchema.parse(draft.data);
      try { validatePublication(data); } catch (error) { throw badRequest((error as Error).message); }
      const lock = await tx.contentDraft.updateMany({ where: { id: "main", revision }, data: { revision: { increment: 1 } } });
      if (!lock.count) throw conflict("O rascunho foi alterado. Recarregue antes de publicar.");
      // Activity identities stay stable; published content lives in immutable releases.
      // Existing completions refer to their own release and snapshot.
      for (const exercise of data.exercises) {
        await tx.activity.upsert({ where: { id: exercise.id }, update: {}, create: {
          id: exercise.id, name: exercise.name, category: exercise.cat,
          description: exercise.desc, durationMinutes: exercise.time, steps: exercise.steps,
          icon: exercise.icon, color: exercise.art, videoId: exercise.videoId,
        } });
      }
      const release = await tx.contentRelease.create({ data: { version: revision + 1, data } });
      await tx.adminAudit.create({ data: { actorId, action: "CONTENT_PUBLISHED", targetId: release.id, fields: ["catalog"] } });
      return release;
    }, { timeout: 15000 });
  },
};
