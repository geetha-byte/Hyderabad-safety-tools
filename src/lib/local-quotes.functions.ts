
import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";
import { quoteInput } from "./quote-input";
import { createLocalQuote } from "./local-quotes.server";

export const submitLocalQuote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => quoteInput.parse(input))
  .handler(async ({ data }) => {
    return await createLocalQuote(data);
  });
