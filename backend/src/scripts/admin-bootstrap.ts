import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { emailField, newPasswordField } from "../validation/fields.js";

// Privileged operator command only. Never accepts a role through a public API.
// Existing accounts are promoted without changing their password.
const email = emailField.parse(process.argv[2]);
try {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.role === "ADMIN") {
    console.log("A conta já possui acesso administrativo; senha mantida.");
  } else {
    let passwordHash: string | undefined;
    if (!existing) {
      const password = newPasswordField.parse(process.env.ADMIN_BOOTSTRAP_PASSWORD);
      if (password.length < 12) throw new Error("Use uma senha administrativa com pelo menos 12 caracteres.");
      passwordHash = await bcrypt.hash(password, 12);
      delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
    }
    await prisma.$transaction(async tx => {
      const user = existing
        ? await tx.user.update({ where: { id: existing.id }, data: { role: "ADMIN", blockedAt: null } })
        : await tx.user.create({ data: { email, name: "Administrador", role: "ADMIN", passwordHash: passwordHash!, termsAcceptedAt: new Date() } });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.adminAudit.create({ data: { actorId: "system:operator", action: "ADMIN_BOOTSTRAPPED", targetId: user.id, fields: ["role"] } });
    });
    console.log("Acesso administrativo configurado. Faça login novamente em /login.");
  }
} finally {
  await prisma.$disconnect();
}
