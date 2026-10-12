import { defineEntity, p, type InferEntity } from "@mikro-orm/postgresql";
import { baseProperties } from "./base.properties";
import { PostSchema } from "./post.entity";
import { UserSchema } from "./user.entity";

export const CommentSchema = defineEntity({
  name: "Comment",
  tableName: "comments",
  properties: {
    ...baseProperties,
    content: p.text(),
    author: () => p.manyToOne(UserSchema).inversedBy("comments").deleteRule("cascade").index(),
    post: () => p.manyToOne(PostSchema).inversedBy("comments").deleteRule("cascade").index(),
  },
});

export type Comment = InferEntity<typeof CommentSchema>;
