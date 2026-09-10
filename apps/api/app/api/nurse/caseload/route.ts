import { NextResponse } from "next/server";
import { requireSession } from "../../../../lib/auth";
import { requireRole } from "../../../../lib/authorization";
import { apiError, corsPreflightResponse, HttpError, withCors } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const nurse = await requireSession(); requireRole(nurse, ["NURSE"]);
    const assignments = await prisma.nurseParticipantAssignment.findMany({ where: { nurseId: nurse.id, isActive: true }, include: { participant: { include: { user: { select: { displayName: true, email: true } }, dailyChecks: { orderBy: { checkDate: "desc" }, take: 1 }, followUps: { orderBy: { dueDate: "asc" } } } } } });
    return withCors(NextResponse.json({ participants: assignments.map(({ participant }) => participant) }));
  } catch (error) { return error instanceof HttpError ? apiError(error.status, error.code, error.message) : apiError(500, "INTERNAL_ERROR", "ไม่สามารถโหลดรายชื่อผู้เข้าร่วมได้"); }
}
export const OPTIONS = corsPreflightResponse;
