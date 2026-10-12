import type { EntityManager } from "@mikro-orm/postgresql";
import { Seeder } from "@mikro-orm/seeder";
import { hashPassword } from "../../lib/password";
import { UserSchema } from "../entities";

export const SEED_PASSWORD = "Password123!";

const seedUsers = [
  { email: "admin@example.com", name: "Admin" },
  { email: "alice@example.com", name: "Alice" },
  { email: "bob@example.com", name: "Bob" },
];

/** Idempotent: skips users whose email already exists (including soft-deleted ones). */
export class UserSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const passwordHash = await hashPassword(SEED_PASSWORD);
    const existing = await em.find(
      UserSchema,
      { email: { $in: seedUsers.map((u) => u.email) } },
      { filters: false, fields: ["email"] },
    );
    const existingEmails = new Set(existing.map((u) => u.email));

    for (const user of seedUsers) {
      if (existingEmails.has(user.email)) continue;
      em.create(UserSchema, { ...user, passwordHash });
    }
    await em.flush();
  }
}
