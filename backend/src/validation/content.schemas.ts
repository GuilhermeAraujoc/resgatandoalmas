import { z } from "zod";
import { youtubeVideoSchema } from "./youtube.js";

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
const text = (max: number) => z.string().trim().min(1).max(max);
export const catalogSchema = z.strictObject({
  questions: z.array(z.strictObject({
    id, text: text(500), topic: text(80), active: z.boolean(),
    options: z.array(z.strictObject({ label: text(120), score: z.number().int().min(0).max(100), active: z.boolean().default(true) })).min(2).max(8),
  })).max(100),
  exercises: z.array(z.strictObject({
    id, name: text(120), cat: text(80), desc: text(1500),
    time: z.number().int().min(1).max(180),
    steps: z.array(text(500)).min(1).max(30),
    icon: z.enum(["wind", "activity", "sun", "leaf", "flower", "heart", "spark"]),
    art: z.enum(["", "green", "orange", "rose"]),
    videoId: youtubeVideoSchema,
    active: z.boolean(),
  })).max(200),
  protocols: z.strictObject({
    vitality: z.strictObject({ name: text(120), description: text(1500), exerciseIds: z.array(id).max(100) }),
    calm: z.strictObject({ name: text(120), description: text(1500), exerciseIds: z.array(id).max(100) }),
  }),
  calmAbove: z.number().int().min(0).max(99),
}).superRefine((data, ctx) => {
  for (const [name, rows] of [["questions", data.questions], ["exercises", data.exercises]] as const) {
    if (new Set(rows.map(row => row.id)).size !== rows.length)
      ctx.addIssue({ code: "custom", path: [name], message: "IDs duplicados no catálogo." });
  }
  const known = new Set(data.exercises.map(exercise => exercise.id));
  for (const [key, protocol] of Object.entries(data.protocols)) {
    if (new Set(protocol.exerciseIds).size !== protocol.exerciseIds.length || protocol.exerciseIds.some(value => !known.has(value)))
      ctx.addIssue({ code: "custom", path: ["protocols", key], message: "O protocolo contém exercícios repetidos ou inexistentes." });
  }
});
export type CatalogData = z.infer<typeof catalogSchema>;
export const saveContentSchema = z.strictObject({ revision: z.number().int().positive(), data: catalogSchema });
export const publishContentSchema = z.strictObject({ revision: z.number().int().positive() });

export function validatePublication(data: CatalogData) {
  if (!data.questions.some(question => question.active)) throw new Error("Ative pelo menos uma pergunta antes de publicar.");
  if (data.questions.some(question => question.active && question.options.filter(option => option.active).length < 2)) throw new Error("Cada pergunta ativa precisa ter pelo menos duas alternativas ativas.");
  const active = new Set(data.exercises.filter(exercise => exercise.active).map(exercise => exercise.id));
  for (const protocol of Object.values(data.protocols)) {
    if (!protocol.exerciseIds.length || protocol.exerciseIds.some(id => !active.has(id)))
      throw new Error("Cada protocolo precisa ter exercícios ativos; remova da sequência os exercícios arquivados.");
  }
}
