import { handle } from "@/src/lib/http";
import * as commentController from "@/app/api/comments/comment.controller";

export const POST = handle(commentController.restore);
