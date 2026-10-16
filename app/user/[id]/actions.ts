"use server";

import { redirect } from "next/navigation";
import { getEm } from "@/src/db/orm";
import { uuidParam } from "@/src/lib/http";
import * as userService from "@/src/modules/users/user.service";

/** Soft deletes the user (cascading to their posts/comments), then returns to the list. */
export async function softDeleteUserAction(id: string) {
  // TODO: no auth check yet — anyone who can reach this page can delete any user.
  await userService.deleteAccount(await getEm(), uuidParam.parse(id));
  redirect("/user");
}
