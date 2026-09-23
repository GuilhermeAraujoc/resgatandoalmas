import { config } from "../config";

/** Error returned by the backend (`{ error: { message, fields } }`) or a network failure. */
export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;
  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

/**
 * JSON request to the backend. `/api` is proxied by Vite, so the session
 * cookie is same-origin and sent automatically.
 */
export async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}${path}`, {
      method,
      credentials: "include",
      signal: AbortSignal.timeout(15000),
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      "Não foi possível conectar ao servidor. Verifique sua conexão.",
    );
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      response.status,
      data?.error?.message ?? "Algo deu errado. Tente novamente.",
      data?.error?.fields,
    );
  if (data === null) throw new ApiError(response.status, "O servidor retornou uma resposta inválida.");
  return data as T;
}

/** User-facing message for a failed API call. */
export function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Algo deu errado. Tente novamente.";
}
