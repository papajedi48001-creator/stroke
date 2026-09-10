import { describe, expect, it } from "vitest";

import { hashSessionToken } from "./auth";

describe("authentication", () => {
  it("hashes session tokens before they are stored", () => {
    expect(hashSessionToken("session-token")).not.toBe("session-token");
    expect(hashSessionToken("session-token")).toHaveLength(64);
  });
});
