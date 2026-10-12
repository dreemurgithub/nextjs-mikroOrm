import { handle } from "@/src/lib/http";
import * as userController from "@/app/api/users/user.controller";

export const GET = handle(userController.get);
