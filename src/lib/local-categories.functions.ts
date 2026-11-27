import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";

import {
  listLocalPublicCategories,
listLocalAdminCategories as listLocalAdminCategoriesService,
  createLocalCategory,
  updateLocalCategory,
  setLocalCategoryStatus,
  deleteLocalCategory,
} from "./local-categories.server";

const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).default(""),
});

const categoryUpdateSchema = categoryInputSchema.extend({
  id: z.string().uuid(),
});

const categoryStatusSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
});

const categoryIdSchema = z.object({
  id: z.string().uuid(),
});

export const listLocalCategories = createServerFn({ method: "GET" })
  .handler(async () => {
    return await listLocalPublicCategories();
  });

export const listLocalAdminCategories = createServerFn({ method: "GET" })
  .handler(async () => {
    return await listLocalAdminCategoriesService();
  });

export const createLocalCategoryFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => categoryInputSchema.parse(input))
  .handler(async ({ data }) => {
    return await createLocalCategory(data);
  });

export const updateLocalCategoryFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => categoryUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    return await updateLocalCategory(data);
  });

export const setLocalCategoryStatusFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => categoryStatusSchema.parse(input))
  .handler(async ({ data }) => {
    return await setLocalCategoryStatus(data);
  });

export const deleteLocalCategoryFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => categoryIdSchema.parse(input))
  .handler(async ({ data }) => {
    return await deleteLocalCategory(data);
  });
