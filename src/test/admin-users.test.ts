import { describe, expect, it } from "vitest";
import { assertRoleChange, userRoleInput } from "@/lib/admin-users";

describe("Admin user roles", () => {
  it("supports regular users and admins only", () => {
    expect(userRoleInput.safeParse({ userId: "11111111-2222-4333-8444-555555555551", role: "admin" }).success).toBe(true);
    expect(userRoleInput.safeParse({ userId: "11111111-2222-4333-8444-555555555551", role: "owner" }).success).toBe(false);
  });
  it("prevents changing your own role", () => {
    expect(() => assertRoleChange("self", { id: "self", verified: true }, "user")).toThrow();
  });
  it("preserves the store owner's admin access", () => {
    expect(() => assertRoleChange("actor", { id: "owner", email: "manojenterprisesinfo@gmail.com", verified: true }, "user")).toThrow();
  });
  it("requires verification before admin promotion", () => {
    expect(() => assertRoleChange("actor", { id: "other", verified: false }, "admin")).toThrow();
    expect(() => assertRoleChange("actor", { id: "other", verified: true }, "admin")).not.toThrow();
  });
});