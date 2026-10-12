import { z } from "zod";
import { paginationSchema } from "@/src/lib/pagination";

export const createPostSchema = z.object({
  title: z.string().trim().min(1).max(255),
  content: z.string().trim().min(1),
});

export const updatePostSchema = createPostSchema
  .partial()
  .refine((v) => v.title !== undefined || v.content !== undefined, "Nothing to update");

export const listPostsQuerySchema = paginationSchema.extend({
  authorId: z.uuid().optional(),
});
