import { defineEntity, p, type InferEntity } from "@mikro-orm/postgresql";
import { baseProperties } from "./base.properties";
import { CommentSchema } from "./comment.entity";
import { TagSchema } from "./tag.entity";
import { UserSchema } from "./user.entity";

export const PostSchema = defineEntity({
  name: "Post",
  tableName: "posts",
  properties: {
    ...baseProperties,
    title: p.string().length(255),
    content: p.text(),
    author: () => p.manyToOne(UserSchema).inversedBy("posts").deleteRule("cascade").index(),
    /** Optional; deleting a tag un-tags its posts instead of deleting them. */
    tag: () => p.manyToOne(TagSchema).inversedBy("posts").nullable().deleteRule("set null").index(),
    comments: () => p.oneToMany(CommentSchema).mappedBy("post"),
  },
});

export type Post = InferEntity<typeof PostSchema>;
