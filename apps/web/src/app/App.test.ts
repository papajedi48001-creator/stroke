import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");

describe("Stroke application routes", () => {
  it("defines protected workspaces for every role", () => {
    for (const path of ["/participant", "/nurse", "/admin", "/participant/daily-check", "/participant/emergency"]) {
      expect(source).toContain(`path=\"${path}\"`);
    }
  });
});
