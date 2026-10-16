"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getEm } from "@/src/db/orm";
import { uuidParam } from "@/src/lib/http";
import { userCacheTags } from "@/src/modules/users/user.cache";
import * as userService from "@/src/modules/users/user.service";

/** Restores the user plus the posts/comments removed with them, then refreshes both lists. */
export async function restoreUserAction(id: string) {
  // TODO: no auth check yet — anyone who can reach this page can restore any user.
  const userId = uuidParam.parse(id);
  await userService.restoreAccount(await getEm(), userId);
  // `/user` and `/user/[id]` are cached: expire their entries (the detail one held a cached 404).
  updateTag(userCacheTags.list);
  updateTag(userCacheTags.detail(userId));
  // `/user/deleted` is not cached (read at request time), it only needs a re-render.
  revalidatePath("/user/deleted");
}
