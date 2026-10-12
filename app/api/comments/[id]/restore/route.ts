import { handle } from "@/src/lib/http";
import * as commentController from "@/src/modules/comments/comment.controller";

export const POST = handle(commentController.restore);
