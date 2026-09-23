import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";
import { isProduction } from "../src/config/env.js";
import {
  ENERGY_LEVELS,
  QUESTION_COUNT,
  assessmentScore,
  scenarioForScore,
} from "../src/domain/energy.js";
import { activities } from "./activities.js";

const DAY = 86_400_000;

async function seedActivities() {
  for (const { id, ...data } of activities)
    await prisma.activity.upsert({ where: { id }, create: { id, ...data }, update: data });
  console.log(`Seeded ${activities.length} activities.`);
}

/** Answers whose weights (0–4 each) add up to `total`, spread evenly. */
function answersSumming(total: number) {
  const base = Math.floor(total / QUESTION_COUNT);
  return Array.from(
    { length: QUESTION_COUNT },
    (_, i) => ENERGY_LEVELS[base + (i < total % QUESTION_COUNT ? 1 : 0)]!,
  );
}

/** Demo account prefilled on the login screen; created once, never overwritten. */
async function seedDemoUser() {
  const email = "mariana@exemplo.com";
  if (await prisma.user.findUnique({ where: { email } })) return;

  const user = await prisma.user.create({
    data: {
      name: "Mariana Silva",
      email,
      cpf: "52998224725", // valid test CPF
      passwordHash: await bcrypt.hash("demo123", 12),
      termsAcceptedAt: new Date(),
    },
  });
  for (const [daysAgo, total] of [[20, 13], [16, 20], [10, 26]] as const) {
    const answers = answersSumming(total);
    const energyScore = assessmentScore(answers);
    await prisma.assessment.create({
      data: {
        userId: user.id,
        energyScore,
        scenario: scenarioForScore(energyScore),
        createdAt: new Date(Date.now() - daysAgo * DAY),
        answers: {
          create: answers.map((level, questionIndex) => ({ questionIndex, level })),
        },
      },
    });
  }
  console.log(`Created demo user ${email} / demo123.`);
}

try {
  await seedActivities();
  if (!isProduction) await seedDemoUser();
} finally {
  await prisma.$disconnect();
}
