import "server-only";
import type { EntityManager } from "@mikro-orm/postgresql";
import { UniqueConstraintViolationException } from "@mikro-orm/postgresql";
import { unstable_rethrow } from "next/navigation";
import { connection, type NextRequest } from "next/server";
import { z } from "zod";
import { getEm } from "@/src/db/orm";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: unknown) => new HttpError(400, message, details);
export const unauthorized = (message = "Unauthorized") => new HttpError(401, message);
export const forbidden = (message = "Forbidden") => new HttpError(403, message);
export const notFound = (message = "Not found") => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);

export type HandlerContext<P = Record<string, string>> = {
  em: EntityManager;
  params: P;
};

/**
 * Wraps a controller function into a Next.js route handler:
 * forks a per-request EntityManager, resolves params and maps errors to JSON responses.
 * Every API route hits the DB, so it is always rendered at request time (never prerendered at build).
 */
export function handle<P = Record<string, string>>(
  controller: (req: NextRequest, ctx: HandlerContext<P>) => Promise<Response>,
) {
  return async (req: NextRequest, routeCtx: { params: Promise<P> }) => {
    await connection();
    try {
      const [em, params] = await Promise.all([getEm(), routeCtx.params]);
      return await controller(req, { em, params });
    } catch (error) {
      unstable_rethrow(error);
      return toErrorResponse(error);
    }
  };
}

function toErrorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message, details: error.details }, { status: error.status });
  }
  if (error instanceof z.ZodError) {
    return Response.json({ error: "Validation failed", details: z.flattenError(error) }, { status: 400 });
  }
  if (error instanceof UniqueConstraintViolationException) {
    return Response.json({ error: "Resource already exists" }, { status: 409 });
  }
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

export async function parseJson<T extends z.ZodType>(req: NextRequest, schema: T): Promise<z.infer<T>> {
  const body = await req.json().catch(() => {
    throw badRequest("Invalid JSON body");
  });
  return schema.parse(body);
}

export function parseQuery<T extends z.ZodType>(req: NextRequest, schema: T): z.infer<T> {
  return schema.parse(Object.fromEntries(req.nextUrl.searchParams));
}

export const uuidParam = z.uuid({ message: "Invalid id" });
