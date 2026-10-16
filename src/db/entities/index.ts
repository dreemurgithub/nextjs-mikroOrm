import { CommentSchema } from "./comment.entity";
import { PostSchema } from "./post.entity";
import { TagSchema } from "./tag.entity";
import { UserSchema } from "./user.entity";

export * from "./comment.entity";
export * from "./post.entity";
export * from "./tag.entity";
export * from "./user.entity";

export const entities = [UserSchema, PostSchema, CommentSchema, TagSchema];
