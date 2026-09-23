/** Errors thrown by services; the error handler turns them into JSON responses. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const unauthorized = (message = "Faça login para continuar.") =>
  new HttpError(401, message);
export const notFound = (message = "Recurso não encontrado.") =>
  new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);
