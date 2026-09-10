import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  findUnique: vi.fn(),
  upsert: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("../../../../lib/auth", () => ({ requireSession: mocks.requireSession }));
vi.mock("../../../../lib/prisma", () => ({
  prisma: { participantProfile: { findUnique: mocks.findUnique }, dailyCheck: { upsert: mocks.upsert } },
}));
vi.mock("../../../../lib/audit", () => ({ audit: mocks.audit }));

import { POST } from "./route";

describe("POST /api/participant/daily-checks", () => {
  it("creates a daily check only for the signed-in participant", async () => {
    mocks.requireSession.mockResolvedValue({ id: "user-id", role: "PARTICIPANT", displayName: "ผู้ใช้" });
    mocks.findUnique.mockResolvedValue({ id: "participant-id" });
    mocks.upsert.mockResolvedValue({ id: "check-id", confidence: 8 });

    const response = await POST(new Request("http://localhost/api/participant/daily-checks", {
      method: "POST",
      body: JSON.stringify({ checkDate: "2026-09-10", confidence: 8, activityMinutes: 30 }),
    }));

    expect(response.status).toBe(201);
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ participantId: "participant-id" }) }));
  });
});
