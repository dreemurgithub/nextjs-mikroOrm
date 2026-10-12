import type { EntityManager } from "@mikro-orm/postgresql";
import { conflict, unauthorized } from "@/src/lib/http";
import { verifyPassword } from "@/src/lib/password";
import { signSessionToken } from "@/src/lib/session";
import * as userCommands from "@/src/modules/users/user.commands";
import * as userQueries from "@/src/modules/users/user.queries";
import type { LoginInput, RegisterInput } from "./auth.schemas";

export async function register(em: EntityManager, input: RegisterInput) {
  // Soft-deleted accounts still own their email (unique constraint), so check including them.
  if (await userQueries.emailExists(em, input.email)) throw conflict("Email is already registered");
  const userId = await userCommands.createUser(em, input);
  const user = (await userQueries.findUserById(em, userId))!;
  return { user, token: await signSessionToken(user.id) };
}

export async function login(em: EntityManager, input: LoginInput) {
  const credentials = await userQueries.findUserCredentialsByEmail(em, input.email);
  const valid =
    credentials &&
    !credentials.user.deletedAt &&
    (await verifyPassword(input.password, credentials.passwordHash));
  if (!valid) throw unauthorized("Invalid email or password");

  return { user: credentials.user, token: await signSessionToken(credentials.user.id) };
}
