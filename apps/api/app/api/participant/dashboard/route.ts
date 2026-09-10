import { NextResponse } from "next/server";

import { requireSession } from "../../../../lib/auth";
import { requireRole } from "../../../../lib/authorization";
import { apiError, corsPreflightResponse, HttpError, withCors } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const session = await requireSession();
    requireRole(session, ["PARTICIPANT"]);
    const participant = await prisma.participantProfile.findUnique({
      where: { userId: session.id },
      include: {
        riskProfile: true,
        goals: { where: { status: "ACTIVE" }, orderBy: { targetDate: "asc" } },
        dailyChecks: { orderBy: { checkDate: "desc" }, take: 7 },
        followUps: { orderBy: { dueDate: "asc" } },
        feedback: { include: { nurse: { select: { displayName: true } } }, orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!participant) return apiError(403, "FORBIDDEN", "ไม่พบข้อมูลผู้เข้าร่วมของคุณ");
    return withCors(NextResponse.json({ participant }));
  } catch (error) {
    if (error instanceof HttpError) return apiError(error.status, error.code, error.message);
    return apiError(500, "INTERNAL_ERROR", "ไม่สามารถโหลดข้อมูลหน้าหลักได้ในขณะนี้");
  }
}

export const OPTIONS = corsPreflightResponse;
