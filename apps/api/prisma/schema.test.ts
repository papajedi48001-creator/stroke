import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("./schema.prisma", import.meta.url), "utf8");

describe("ER-STROKE SAFE database schema", () => {
  it("defines ownership and audit models required by the programme", () => {
    for (const model of [
      "User",
      "ParticipantProfile",
      "NurseParticipantAssignment",
      "Goal",
      "DailyCheck",
      "NurseFeedback",
      "AuditLog",
    ]) {
      expect(schema).toContain(`model ${model}`);
    }
  });
});
