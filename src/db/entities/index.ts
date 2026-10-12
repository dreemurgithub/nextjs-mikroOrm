import { CommentSchema } from "./comment.entity";
import { PostSchema } from "./post.entity";
import { UserSchema } from "./user.entity";

export * from "./comment.entity";
export * from "./post.entity";
export * from "./user.entity";

export const entities = [UserSchema, PostSchema, CommentSchema];
