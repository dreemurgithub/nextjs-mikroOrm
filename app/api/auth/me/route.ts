import { handle } from "@/src/lib/http";
import * as authController from "@/app/api/auth/auth.controller";

export const GET = handle(authController.me);
