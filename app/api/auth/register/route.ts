import { handle } from "@/src/lib/http";
import * as authController from "@/src/modules/auth/auth.controller";

export const POST = handle(authController.register);
