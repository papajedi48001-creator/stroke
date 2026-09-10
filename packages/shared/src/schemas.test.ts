import { describe, expect, it } from "vitest";

import { createGoalSchema, loginSchema } from "./schemas";

describe("shared input schemas", () => {
  it("rejects a goal without a measurable target date", () => {
    expect(() => createGoalSchema.parse({ title: "เดิน", frequency: 0 })).toThrow();
  });

  it("rejects an invalid email at login", () => {
    expect(() => loginSchema.parse({ email: "not-email", password: "short" })).toThrow();
  });
});
