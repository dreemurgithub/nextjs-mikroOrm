import { handle } from "@/src/lib/http";
import * as commentController from "@/src/modules/comments/comment.controller";

export const GET = handle(commentController.get);
export const PATCH = handle(commentController.update);
export const DELETE = handle(commentController.remove);
