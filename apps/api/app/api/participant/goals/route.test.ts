import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("../../../../lib/auth", () => ({ requireSession: mocks.requireSession }));
vi.mock("../../../../lib/prisma", () => ({
  prisma: { participantProfile: { findUnique: mocks.findUnique }, goal: { create: mocks.create } },
}));
vi.mock("../../../../lib/audit", () => ({ audit: mocks.audit }));

import { POST } from "./route";

describe("POST /api/participant/goals", () => {
  it("creates a goal only for the signed-in participant", async () => {
    mocks.requireSession.mockResolvedValue({ id: "user-id", role: "PARTICIPANT", displayName: "ผู้ใช้" });
    mocks.findUnique.mockResolvedValue({ id: "participant-id" });
    mocks.create.mockResolvedValue({ id: "goal-id", title: "เดิน" });

    const response = await POST(new Request("http://localhost/api/participant/goals", {
      method: "POST",
      body: JSON.stringify({ title: "เดินทุกวัน", behavior: "เดินเร็ว", frequency: 5, targetDate: "2026-12-01" }),
    }));

    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ participantId: "participant-id" }) }));
  });
});
