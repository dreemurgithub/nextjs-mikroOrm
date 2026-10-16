"use server";

import { revalidatePath } from "next/cache";
import { getEm } from "@/src/db/orm";
import { uuidParam } from "@/src/lib/http";
import * as userService from "@/src/modules/users/user.service";

/** Restores the user plus the posts/comments removed with them, then refreshes both lists. */
export async function restoreUserAction(id: string) {
  // TODO: no auth check yet — anyone who can reach this page can restore any user.
  await userService.restoreAccount(await getEm(), uuidParam.parse(id));
  revalidatePath("/user/deleted");
  revalidatePath("/user");
}
