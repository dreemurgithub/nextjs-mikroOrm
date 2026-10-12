import { handle } from "@/src/lib/http";
import * as authController from "@/app/api/auth/auth.controller";

export const POST = handle(authController.login);
