import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, findFirst } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("./prisma", () => ({
  prisma: {
    participantProfile: { findUnique },
    nurseParticipantAssignment: { findFirst },
  },
}));

import { requireNurseAssignment, requireParticipantOwnership } from "./authorization";

const participantSession = {
  id: "participant-user-id",
  role: "PARTICIPANT" as const,
  displayName: "ผู้เข้าร่วมตัวอย่าง",
};

const assignedNurseSession = {
  id: "nurse-user-id",
  role: "NURSE" as const,
  displayName: "พยาบาลตัวอย่าง",
};

describe("authorization", () => {
  beforeEach(() => {
    findUnique.mockReset();
    findFirst.mockReset();
  });

  it("rejects a participant attempting to read a different participant", async () => {
    findUnique.mockResolvedValue(null);

    await expect(requireParticipantOwnership(participantSession, "other-participant-id")).rejects.toMatchObject({
      status: 403,
    });
  });

  it("permits an assigned nurse", async () => {
    findFirst.mockResolvedValue({ id: "assignment-id" });

    await expect(requireNurseAssignment(assignedNurseSession, "participant-id")).resolves.toBeUndefined();
  });
});
