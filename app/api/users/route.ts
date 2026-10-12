import { handle } from "@/src/lib/http";
import * as userController from "@/src/modules/users/user.controller";

export const GET = handle(userController.list);
