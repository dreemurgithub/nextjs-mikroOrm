import type { EntityManager } from "@mikro-orm/postgresql";
import { Seeder } from "@mikro-orm/seeder";
import { PostSeeder } from "./PostSeeder";
import { StaticSeeder } from "./StaticSeeder";
import { UserSeeder } from "./UserSeeder";

/** Full dev/demo dataset: static data + fake users, posts and comments. */
export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    return this.call(em, [StaticSeeder, UserSeeder, PostSeeder]);
  }
}
