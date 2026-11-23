import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoreProvider, useStore } from "@/lib/store";
import { useStore as useContextStore } from "@/lib/store-context";

describe("Store provider", () => {
  it("shares the same context through provider and consumer imports", async () => {
    localStorage.clear();
    const { result, rerender } = renderHook(() => ({ store: useStore(), direct: useContextStore() }), { wrapper: StoreProvider });
    await waitFor(() => expect(result.current.store.count).toBe(0));
    act(() => result.current.store.add("helmet", 2, undefined, "Yellow"));
    rerender();
    expect(result.current.direct).toBe(result.current.store);
    expect(result.current.direct.count).toBe(2);
    expect(result.current.direct.cart[0]?.colour).toBe("Yellow");
  });
});