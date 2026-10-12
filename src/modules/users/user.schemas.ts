import { z } from "zod";

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    password: z.string().min(8).max(72).optional(),
  })
  .refine((v) => v.name !== undefined || v.password !== undefined, "Nothing to update");
