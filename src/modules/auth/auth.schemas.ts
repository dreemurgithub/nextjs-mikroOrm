import { z } from "zod";

export const registerSchema = z.object({
  email: z.email().max(255),
  name: z.string().trim().min(1).max(100),
  // bcrypt only uses the first 72 bytes
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
