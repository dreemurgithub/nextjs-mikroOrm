import type { EntityManager } from "@mikro-orm/postgresql";
import type { NextRequest } from "next/server";
import { unauthorized } from "@/src/lib/http";
import { readSessionToken, verifySessionToken } from "@/src/lib/session";
import { findUserById, type UserView } from "@/src/modules/users/user.queries";

/** Current user, or null. Soft-deleted users are filtered out, so their old tokens stop working. */
export async function getAuthUser(req: NextRequest, em: EntityManager): Promise<UserView | null> {
  const token = readSessionToken(req);
  if (!token) return null;
  const userId = await verifySessionToken(token);
  if (!userId) return null;
  return findUserById(em, userId);
}

export async function requireAuth(req: NextRequest, em: EntityManager): Promise<UserView> {
  const user = await getAuthUser(req, em);
  if (!user) throw unauthorized();
  return user;
}
