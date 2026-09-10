import { NextResponse } from "next/server";
import { requireSession } from "../../../../lib/auth";
import { audit } from "../../../../lib/audit";
import { requireRole } from "../../../../lib/authorization";
import { apiError, corsPreflightResponse, HttpError, withCors } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const admin = await requireSession(); requireRole(admin, ["ADMIN"]);
    const input = await request.json();
    if (typeof input.nurseId !== "string" || typeof input.participantId !== "string") return apiError(422, "INVALID_INPUT", "กรุณาเลือกพยาบาลและผู้เข้าร่วม");
    const [nurse, participant] = await Promise.all([prisma.user.findFirst({ where: { id: input.nurseId, role: "NURSE", isActive: true } }), prisma.participantProfile.findUnique({ where: { id: input.participantId } })]);
    if (!nurse || !participant) return apiError(422, "INVALID_INPUT", "ข้อมูลการมอบหมายไม่ถูกต้อง");
    const existing = await prisma.nurseParticipantAssignment.findFirst({ where: { nurseId: nurse.id, participantId: participant.id, isActive: true } });
    if (existing) return apiError(409, "DUPLICATE_ASSIGNMENT", "มีการมอบหมายนี้อยู่แล้ว");
    const assignment = await prisma.nurseParticipantAssignment.create({ data: { nurseId: nurse.id, participantId: participant.id } });
    await audit(admin.id, "NURSE_ASSIGNED", "NurseParticipantAssignment", assignment.id, "มอบหมายพยาบาลให้ผู้เข้าร่วม");
    return withCors(NextResponse.json({ assignment }, { status: 201 }));
  } catch (error) { return error instanceof HttpError ? apiError(error.status, error.code, error.message) : apiError(500, "INTERNAL_ERROR", "ไม่สามารถบันทึกการมอบหมายได้"); }
}
export const OPTIONS = corsPreflightResponse;
