import type { EntityManager } from "@mikro-orm/postgresql";
import { Seeder } from "@mikro-orm/seeder";
import { TagSeeder } from "./TagSeeder";

/** Data every environment needs (incl. production). Demo/fake data belongs in `DatabaseSeeder`. */
export class StaticSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    return this.call(em, [TagSeeder]);
  }
}
