import { contentRepository } from "../repositories/content.repository.js";
import { notFound } from "../lib/errors.js";
import { catalogSchema, type CatalogData } from "../validation/content.schemas.js";

export const contentService = {
  async get(id?: string) {
    const release = id ? await contentRepository.byId(id) : await contentRepository.latest();
    if (!release) throw notFound("Catálogo ainda não disponível. Execute a inicialização do sistema.");
    return { id: release.id, version: release.version, ...catalogSchema.parse(release.data) };
  },
};

export function visibleCatalog<T extends CatalogData>(catalog: T): T {
  return {
    ...catalog,
    questions: catalog.questions.filter(question => question.active).map(question => ({
      ...question,
      // Keep option indexes stable, but do not expose archived alternative text.
      options: question.options.map(option => option.active ? option : { label: "Indisponível", score: 0, active: false }),
    })),
    exercises: catalog.exercises.filter(exercise => exercise.active),
  };
}
