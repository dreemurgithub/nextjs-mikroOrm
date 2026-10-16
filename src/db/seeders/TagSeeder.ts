import type { EntityManager } from "@mikro-orm/postgresql";
import { Seeder } from "@mikro-orm/seeder";
import { TagSchema } from "../entities";

const seedTags = [
  { slug: "announcement", name: "Announcement" },
  { slug: "database", name: "Database" },
  { slug: "mikro-orm", name: "MikroORM" },
  { slug: "architecture", name: "Architecture" },
  { slug: "off-topic", name: "Off-topic" },
];

/** Idempotent: skips tags whose slug already exists (including soft-deleted ones). */
export class TagSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const existing = await em.find(
      TagSchema,
      { slug: { $in: seedTags.map((t) => t.slug) } },
      { filters: false, fields: ["slug"] },
    );
    const existingSlugs = new Set(existing.map((t) => t.slug));

    for (const tag of seedTags) {
      if (existingSlugs.has(tag.slug)) continue;
      em.create(TagSchema, tag);
    }
    await em.flush();
  }
}
