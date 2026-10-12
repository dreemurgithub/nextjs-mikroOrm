import { handle } from "@/src/lib/http";
import * as userController from "@/app/api/users/user.controller";

export const PATCH = handle(userController.updateMe);
export const DELETE = handle(userController.deleteMe);
