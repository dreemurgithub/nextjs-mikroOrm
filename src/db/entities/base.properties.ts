import { randomUUID } from "node:crypto";
import { p } from "@mikro-orm/postgresql";

/**
 * Columns every table shares: uuid PK, audit timestamps and the soft-delete marker.
 * Spread into each `defineEntity({ properties: { ...baseProperties, ... } })`.
 */
export const baseProperties = {
  id: p.uuid().primary().onCreate(() => randomUUID()),
  createdAt: p.datetime().onCreate(() => new Date()),
  updatedAt: p
    .datetime()
    .onCreate(() => new Date())
    .onUpdate(() => new Date()),
  /** `null` = alive. Set => soft deleted and hidden by the `softDelete` filter. */
  deletedAt: p.datetime().nullable().index(),
};
