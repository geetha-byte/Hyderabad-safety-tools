import { z } from "zod";
import { localDb } from "./local-db.server";
import { requireLocalAdmin } from "./local-admin.server";

export type LocalCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_active: boolean;
};

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

function makeCategorySlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function listLocalPublicCategories(): Promise<LocalCategory[]> {
  return await localDb<LocalCategory[]>`
    SELECT id, slug, name, description, is_active
    FROM public.categories
    WHERE is_active = TRUE
    ORDER BY name ASC
  `;
}

export async function listLocalAdminCategories(): Promise<LocalCategory[]> {
  await requireLocalAdmin();

  return await localDb<LocalCategory[]>`
    SELECT id, slug, name, description, is_active
    FROM public.categories
    ORDER BY name ASC
  `;
}

export async function createLocalCategory(input: unknown) {
  await requireLocalAdmin();

  const data = categoryInputSchema.parse(input);
  const slug = makeCategorySlug(data.name);

  if (!slug) {
    throw new Error("Category name must contain letters or numbers.");
  }

  const result = await localDb`
    INSERT INTO public.categories (slug, name, description)
    VALUES (${slug}, ${data.name}, ${data.description})
    RETURNING id, slug, name, description, is_active
  `;

  return result[0];
}

export async function updateLocalCategory(input: unknown) {
  await requireLocalAdmin();

  const data = categoryUpdateSchema.parse(input);

  const result = await localDb`
    UPDATE public.categories
    SET
      name = ${data.name},
      description = ${data.description},
      updated_at = NOW()
    WHERE id = ${data.id}
    RETURNING id, slug, name, description, is_active
  `;

  if (result.length === 0) {
    throw new Error("Category not found.");
  }

  return result[0];
}
export async function setLocalCategoryStatus(input: unknown) {
  await requireLocalAdmin();

  const data = categoryStatusSchema.parse(input);

  if (!data.isActive) {
    const products = await localDb<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM public.products
      WHERE category = (
        SELECT slug FROM public.categories WHERE id = ${data.id}
      )
    `;

    if (products[0]?.count) {
      throw new Error(
        "This category has products assigned. Reassign those products before deactivating it.",
      );
    }
  }

  const result = await localDb`
    UPDATE public.categories
    SET is_active = ${data.isActive}, updated_at = NOW()
    WHERE id = ${data.id}
    RETURNING id, slug, name, description, is_active
  `;

  if (result.length === 0) {
    throw new Error("Category not found.");
  }

  return result[0];
}

export async function deleteLocalCategory(input: unknown) {
  await requireLocalAdmin();

  const data = categoryIdSchema.parse(input);

  const result = await localDb.begin(async (tx) => {
    const category = await tx<{ slug: string }[]>`
      SELECT slug
      FROM public.categories
      WHERE id = ${data.id}
      FOR UPDATE
    `;

    if (category.length === 0) {
      throw new Error("Category not found.");
    }

    const categorySlug = category[0]!.slug;

    const products = await tx<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM public.products
      WHERE category = ${categorySlug}
    `;

    if (products[0]?.count) {
      throw new Error(
        "Cannot delete this category because products are assigned to it.",
      );
    }

    return await tx`
      DELETE FROM public.categories
      WHERE id = ${data.id}
      RETURNING id
    `;
  });

  if (result.length === 0) {
    throw new Error("Category could not be deleted.");
  }

  return { success: true };
}
