import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";
import { Prisma } from "../generated/db/client.js";

interface ErrorBody {
  error: { message: string; fields?: Record<string, string> };
}

export function notFoundHandler(_req: Request, res: Response<ErrorBody>) {
  res.status(404).json({ error: { message: "Rota não encontrada." } });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response<ErrorBody>,
  _next: NextFunction,
) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { message: error.message } });
    return;
  }
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues)
      fields[issue.path.join(".") || "body"] ??= issue.message;
    res.status(400).json({
      error: {
        message: error.issues[0]?.message ?? "Dados inválidos.",
        fields,
      },
    });
    return;
  }
  if (error && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
    res.status(413).json({ error: { message: "Conteúdo muito grande. Reduza os textos e tente novamente." } });
    return;
  }
  // Malformed JSON body (thrown by express.json()).
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: { message: "JSON inválido." } });
    return;
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    res
      .status(409)
      .json({ error: { message: "Já existe um cadastro com esses dados." } });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2025"].includes(error.code)) {
    res.status(409).json({ error: { message: "Os dados foram alterados. Atualize a página e tente novamente." } });
    return;
  }
  console.error(error instanceof Error ? error.name : "Unknown error");
  res.status(500).json({ error: { message: "Erro interno do servidor." } });
}
