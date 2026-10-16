"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getEm } from "@/src/db/orm";
import { uuidParam } from "@/src/lib/http";
import { userCacheTags } from "@/src/modules/users/user.cache";
import * as userService from "@/src/modules/users/user.service";

/** Soft deletes the user (cascading to their posts/comments), then returns to the list. */
export async function softDeleteUserAction(id: string) {
  // TODO: no auth check yet — anyone who can reach this page can delete any user.
  const userId = uuidParam.parse(id);
  await userService.deleteAccount(await getEm(), userId);
  // updateTag (server actions only) expires the entries right away, so the redirected list
  // is re-read from the DB instead of still showing the deleted user.
  updateTag(userCacheTags.list);
  updateTag(userCacheTags.detail(userId));
  redirect("/user");
}
