import { createDailyCheckSchema } from "@stroke/shared";
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
    const input = createDailyCheckSchema.safeParse(await request.json());
    if (!input.success) return apiError(422, "INVALID_INPUT", "ข้อมูลบันทึกประจำวันไม่ถูกต้อง");
    const participant = await prisma.participantProfile.findUnique({ where: { userId: session.id }, select: { id: true } });
    if (!participant) return apiError(403, "FORBIDDEN", "ไม่พบข้อมูลผู้เข้าร่วมของคุณ");
    const checkDate = new Date(`${input.data.checkDate}T00:00:00.000Z`);
    const data = { participantId: participant.id, checkDate, confidence: input.data.confidence, activityMinutes: input.data.activityMinutes, systolicBp: input.data.systolicBp, diastolicBp: input.data.diastolicBp, medicationStatus: input.data.medicationStatus, note: input.data.note };
    const dailyCheck = await prisma.dailyCheck.upsert({ where: { participantId_checkDate: { participantId: participant.id, checkDate } }, create: data, update: data });
    await audit(session.id, "DAILY_CHECK_SAVED", "DailyCheck", dailyCheck.id, "บันทึกข้อมูลประจำวัน");
    return withCors(NextResponse.json({ dailyCheck }, { status: 201 }));
  } catch (error) {
    if (error instanceof HttpError) return apiError(error.status, error.code, error.message);
    return apiError(500, "INTERNAL_ERROR", "ไม่สามารถบันทึกข้อมูลประจำวันได้ในขณะนี้");
  }
}

export const OPTIONS = corsPreflightResponse;
