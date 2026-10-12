import { handle } from "@/src/lib/http";
import * as postController from "@/app/api/posts/post.controller";

export const GET = handle(postController.get);
export const PATCH = handle(postController.update);
export const DELETE = handle(postController.remove);
