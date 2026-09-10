import { NextResponse } from "next/server";
import { requireSession } from "../../../../../lib/auth";
import { requireNurseAssignment } from "../../../../../lib/authorization";
import { apiError, corsPreflightResponse, HttpError, withCors } from "../../../../../lib/http";
import { prisma } from "../../../../../lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ participantId: string }> }) {
  try {
    const nurse = await requireSession(); const { participantId } = await context.params;
    await requireNurseAssignment(nurse, participantId);
    const participant = await prisma.participantProfile.findUnique({ where: { id: participantId }, include: { user: { select: { displayName: true, email: true } }, riskProfile: true, goals: { orderBy: { targetDate: "asc" } }, dailyChecks: { orderBy: { checkDate: "desc" }, take: 30 }, feedback: { orderBy: { createdAt: "desc" }, take: 10 } } });
    if (!participant) return apiError(404, "NOT_FOUND", "ไม่พบผู้เข้าร่วม");
    return withCors(NextResponse.json({ participant }));
  } catch (error) { return error instanceof HttpError ? apiError(error.status, error.code, error.message) : apiError(500, "INTERNAL_ERROR", "ไม่สามารถโหลดข้อมูลผู้เข้าร่วมได้"); }
}
export const OPTIONS = corsPreflightResponse;
