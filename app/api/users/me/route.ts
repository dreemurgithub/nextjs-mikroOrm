import { handle } from "@/src/lib/http";
import * as userController from "@/src/modules/users/user.controller";

export const PATCH = handle(userController.updateMe);
export const DELETE = handle(userController.deleteMe);
