import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/schemas/auth.schema";

describe("auth schemas", () => {
  it("validates login input", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email on login", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("validates register input with strong password", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects weak password on register", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "weak",
    });
    expect(result.success).toBe(false);
  });
});
