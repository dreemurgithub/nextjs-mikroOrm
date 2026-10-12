import { defineEntity, p, type InferEntity } from "@mikro-orm/postgresql";
import { baseProperties } from "./base.properties";
import { CommentSchema } from "./comment.entity";
import { PostSchema } from "./post.entity";

export const UserSchema = defineEntity({
  name: "User",
  tableName: "users",
  properties: {
    ...baseProperties,
    email: p.string().length(255).unique(),
    name: p.string().length(100),
    /** Never serialized, and only loaded when explicitly requested (login). */
    passwordHash: p.string().hidden().lazy(),
    posts: () => p.oneToMany(PostSchema).mappedBy("author"),
    comments: () => p.oneToMany(CommentSchema).mappedBy("author"),
  },
});

export type User = InferEntity<typeof UserSchema>;
