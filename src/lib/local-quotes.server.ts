
import { localDb } from "./local-db.server";
import type { QuoteInput } from "./quote-input";

type QuoteProductRow = {
  id: string;
  name: string;
  sku: string;
  price: string | number;
  sale_price: string | number | null;
  gst_rate: string | number;
};

const toPaise = (amount: number) => Math.round(amount * 100);
const fromPaise = (amount: number) => amount / 100;

export async function createLocalQuote(input: QuoteInput) {
  const ids = [...new Set(input.items.map((item) => item.id))];

  const products = await localDb<QuoteProductRow[]>`
    SELECT id, name, sku, price, sale_price, gst_rate
    FROM public.products
    WHERE id = ANY(${ids}::uuid[])
      AND is_published = TRUE
  `;

  const productMap = new Map(products.map((product) => [product.id, product]));

  const lines = input.items.map((item) => {
    const product = productMap.get(item.id);

    if (!product) {
      throw new Error("One or more selected products are unavailable.");
    }

    const unitPrice = Number(product.sale_price ?? product.price);
    const gstRate = Number(product.gst_rate);

    if (!Number.isFinite(unitPrice) || unitPrice < 0 ||
        !Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100) {
      throw new Error(`Invalid price or GST for ${product.name}.`);
    }

    const unitPricePaise = toPaise(unitPrice);
    const subtotalPaise = unitPricePaise * item.qty;
    const gstPaise = Math.round(subtotalPaise * gstRate / 100);

    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: item.qty,
      size: item.size ?? "",
      colour: item.colour ?? "",
      unitPrice: fromPaise(unitPricePaise),
      gstRate,
      subtotal: fromPaise(subtotalPaise),
      gstAmount: fromPaise(gstPaise),
      total: fromPaise(subtotalPaise + gstPaise),
    };
  });

  const subtotalPaise = lines.reduce(
    (sum, line) => sum + toPaise(line.subtotal), 0
  );
  const gstPaise = lines.reduce(
    (sum, line) => sum + toPaise(line.gstAmount), 0
  );
  const grandTotalPaise = subtotalPaise + gstPaise;

  const snapshot = {
    currency: "INR",
    lines,
    subtotal: fromPaise(subtotalPaise),
    gstAmount: fromPaise(gstPaise),
    grandTotal: fromPaise(grandTotalPaise),
  };

  const saved = await localDb<{ id: string; created_at: Date }[]>`
    INSERT INTO public.quote_requests (
      customer_name, company_name, email, mobile, notes, items
    ) VALUES (
      ${input.customerName},
      ${input.companyName},
      ${input.email},
      ${input.mobile},
      ${input.notes},
      ${JSON.stringify(snapshot)}::jsonb
    )
    RETURNING id, created_at
  `;

  const savedQuote = saved[0];

if (!savedQuote) {
  throw new Error("Unable to save the quotation request.");
}

return {
  id: savedQuote.id,
  createdAt: savedQuote.created_at,
  ...snapshot,
};
}
