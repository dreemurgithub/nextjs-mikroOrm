import { defineEntity, p, type InferEntity } from "@mikro-orm/postgresql";
import { baseProperties } from "./base.properties";
import { PostSchema } from "./post.entity";

export const TagSchema = defineEntity({
  name: "Tag",
  tableName: "tags",
  properties: {
    ...baseProperties,
    name: p.string().length(50),
    slug: p.string().length(50).unique(),
    posts: () => p.oneToMany(PostSchema).mappedBy("tag"),
  },
});

export type Tag = InferEntity<typeof TagSchema>;
