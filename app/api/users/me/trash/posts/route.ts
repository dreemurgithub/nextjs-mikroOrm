import { handle } from "@/src/lib/http";
import * as postController from "@/src/modules/posts/post.controller";

export const GET = handle(postController.listMyTrash);
