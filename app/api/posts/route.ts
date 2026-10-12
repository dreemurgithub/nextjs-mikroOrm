import { handle } from "@/src/lib/http";
import * as postController from "@/src/modules/posts/post.controller";

export const GET = handle(postController.list);
export const POST = handle(postController.create);
