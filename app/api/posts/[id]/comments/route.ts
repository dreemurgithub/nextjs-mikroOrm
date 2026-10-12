import { handle } from "@/src/lib/http";
import * as commentController from "@/app/api/comments/comment.controller";

export const GET = handle(commentController.listForPost);
export const POST = handle(commentController.createForPost);
