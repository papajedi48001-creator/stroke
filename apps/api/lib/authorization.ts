import type { Role } from "@stroke/shared";

import { forbidden } from "./http";
import { prisma } from "./prisma";

export type SessionUser = { id: string; role: Role; displayName: string };

export function requireRole(session: SessionUser, allowedRoles: Role[]) {
  if (!allowedRoles.includes(session.role)) {
    throw forbidden();
  }
}

export async function requireParticipantOwnership(session: SessionUser, participantId: string) {
  requireRole(session, ["PARTICIPANT"]);
  const participant = await prisma.participantProfile.findUnique({
    where: { id: participantId },
    select: { userId: true },
  });

  if (!participant || participant.userId !== session.id) {
    throw forbidden();
  }
}

export async function requireNurseAssignment(session: SessionUser, participantId: string) {
  requireRole(session, ["NURSE"]);
  const assignment = await prisma.nurseParticipantAssignment.findFirst({
    where: { nurseId: session.id, participantId, isActive: true },
    select: { id: true },
  });

  if (!assignment) {
    throw forbidden();
  }
}
