import { createGoalSchema } from "@stroke/shared";
import { NextResponse } from "next/server";

import { requireSession } from "../../../../lib/auth";
import { audit } from "../../../../lib/audit";
import { requireRole } from "../../../../lib/authorization";
import { apiError, corsPreflightResponse, HttpError, withCors } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    requireRole(session, ["PARTICIPANT"]);
    const input = createGoalSchema.safeParse(await request.json());
    if (!input.success) return apiError(422, "INVALID_INPUT", "ข้อมูลเป้าหมายไม่ถูกต้อง");
    const participant = await prisma.participantProfile.findUnique({ where: { userId: session.id }, select: { id: true } });
    if (!participant) return apiError(403, "FORBIDDEN", "ไม่พบข้อมูลผู้เข้าร่วมของคุณ");

    const goal = await prisma.goal.create({
      data: {
        participantId: participant.id,
        title: input.data.title,
        behavior: input.data.behavior,
        frequency: input.data.frequency,
        targetDate: new Date(`${input.data.targetDate}T00:00:00.000Z`),
        obstaclePlans: input.data.obstaclePlan
          ? { create: { ...input.data.obstaclePlan, participant: { connect: { id: participant.id } } } }
          : undefined,
      },
    });
    await audit(session.id, "GOAL_CREATED", "Goal", goal.id, "สร้างเป้าหมาย SMART");
    return withCors(NextResponse.json({ goal }, { status: 201 }));
  } catch (error) {
    if (error instanceof HttpError) return apiError(error.status, error.code, error.message);
    return apiError(500, "INTERNAL_ERROR", "ไม่สามารถบันทึกเป้าหมายได้ในขณะนี้");
  }
}

export const OPTIONS = corsPreflightResponse;
