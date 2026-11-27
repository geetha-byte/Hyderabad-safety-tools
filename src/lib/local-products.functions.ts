import { requireLocalAdmin } from "./local-admin.server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";
export type { ProductInput } from "./product-input";
import {
  listLocalPublicProducts,
  listLocalAdminProducts as listLocalAdminProductsService,
  saveLocalProduct as saveProductService,
  deleteLocalProduct as deleteProductService,
  importLocalProductCsv as importCsvService,
} from "./local-products.server";
import { productInput } from "./product-input";

const idSchema = z.object({ id: z.string().uuid() });
const csvSchema = z.object({ csv: z.string().max(5 * 1024 * 1024) });

export const listLocalProducts = createServerFn({ method: "GET" })
  .handler(async () => {
    return await listLocalPublicProducts();
  });

export const listLocalAdminProducts = createServerFn({ method: "GET" })
  .handler(async () => {
    return await listLocalAdminProductsService();
  });

export const saveLocalProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => productInput.parse(input))
  .handler(async ({ data }) => {
    return await saveProductService(data);
  });

export const deleteLocalProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) => {
    return await deleteProductService(data);
  });

export const importLocalProductCsv = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => csvSchema.parse(input))
  .handler(async ({ data }) => {
    return await importCsvService(data.csv);
  });
const imageUploadSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  base64: z.string().min(1).max(7_000_000),
});
export const uploadLocalProductImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => imageUploadSchema.parse(input))
  .handler(async ({ data }) => {
    await requireLocalAdmin();

    const buffer = Buffer.from(data.base64, "base64");
    const isJpeg =
  buffer.length >= 3 &&
  buffer[0] === 0xff &&
  buffer[1] === 0xd8 &&
  buffer[2] === 0xff;

const isPng =
  buffer.length >= 8 &&
  buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

const isWebp =
  buffer.length >= 12 &&
  buffer.toString("ascii", 0, 4) === "RIFF" &&
  buffer.toString("ascii", 8, 12) === "WEBP";

if (
  (data.mimeType === "image/jpeg" && !isJpeg) ||
  (data.mimeType === "image/png" && !isPng) ||
  (data.mimeType === "image/webp" && !isWebp)
) {
  throw new Error("The uploaded file is not a valid image of the selected type.");
}
    if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
      throw new Error("Image must be smaller than 5 MB.");
    }

    const extension =
      data.mimeType === "image/png"
        ? "png"
        : data.mimeType === "image/webp"
          ? "webp"
          : "jpg";

    const imageDir = path.join(process.cwd(), "public", "images", "products");
const outputImageDir = path.join(
  process.cwd(),
  ".output",
  "public",
  "images",
  "products",
);

await mkdir(imageDir, { recursive: true });
await mkdir(outputImageDir, { recursive: true });

const fileName = `${randomUUID()}.${extension}`;

await writeFile(path.join(imageDir, fileName), buffer);
await writeFile(path.join(outputImageDir, fileName), buffer);
    return { path: `/images/products/${fileName}` };
  });
