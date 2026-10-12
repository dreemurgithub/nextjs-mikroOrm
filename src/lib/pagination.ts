import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function toFindOptions({ page, pageSize }: Pagination) {
  return { limit: pageSize, offset: (page - 1) * pageSize };
}

export function paginated<T>(items: T[], total: number, { page, pageSize }: Pagination): Paginated<T> {
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
