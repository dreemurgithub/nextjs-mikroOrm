import type { EntityManager } from "@mikro-orm/postgresql";
import { notFound } from "@/src/lib/http";
import type { Pagination } from "@/src/lib/pagination";
import * as commands from "./user.commands";
import * as queries from "./user.queries";

export async function getUser(em: EntityManager, id: string) {
  const user = await queries.findUserById(em, id);
  if (!user) throw notFound("User not found");
  return user;
}

export function listUsers(em: EntityManager, pagination: Pagination) {
  return queries.listUsers(em, pagination);
}

export async function updateProfile(em: EntityManager, userId: string, cmd: commands.UpdateUserCommand) {
  await commands.updateUser(em, userId, cmd);
  return getUser(em, userId);
}

export async function deleteAccount(em: EntityManager, userId: string) {
  await getUser(em, userId);
  await commands.softDeleteUser(em, userId);
}
