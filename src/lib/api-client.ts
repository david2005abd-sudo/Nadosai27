import { ar } from "@/messages/ar";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (data as { error?: { message?: string } } | null)?.error?.message ?? ar.errors.serverError;
    throw new ApiError(response.status, message);
  }
  return data as T;
}
