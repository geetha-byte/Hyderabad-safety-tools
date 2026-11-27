import * as z from "zod";

export const quoteInput = z.object({
  customerName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().max(160).default(""),
  email: z.string().trim().email().max(254),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/),
  notes: z.string().trim().max(2000).default(""),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      qty: z.number().int().min(1).max(100000),
      size: z.string().trim().max(30).optional(),
      colour: z.string().trim().max(80).optional(),
    })
  ).min(1).max(100),
});

export type QuoteInput = z.infer<typeof quoteInput>;