import { feedbackSchema } from "@stroke/shared";
import { NextResponse } from "next/server";
import { requireSession } from "../../../../../../lib/auth";
import { audit } from "../../../../../../lib/audit";
import { requireNurseAssignment } from "../../../../../../lib/authorization";
import { apiError, corsPreflightResponse, HttpError, withCors } from "../../../../../../lib/http";
import { prisma } from "../../../../../../lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ participantId: string }> }) {
  try {
    const nurse = await requireSession();
    const { participantId } = await context.params;
    await requireNurseAssignment(nurse, participantId);
    const input = feedbackSchema.safeParse(await request.json());
    if (!input.success) return apiError(422, "INVALID_INPUT", "ข้อมูล feedback ไม่ถูกต้อง");
    const feedback = await prisma.nurseFeedback.create({ data: { participantId, nurseId: nurse.id, body: input.data.body } });
    await audit(nurse.id, "NURSE_FEEDBACK_CREATED", "NurseFeedback", feedback.id, "ส่งข้อเสนอแนะถึงผู้เข้าร่วม");
    return withCors(NextResponse.json({ feedback }, { status: 201 }));
  } catch (error) { return error instanceof HttpError ? apiError(error.status, error.code, error.message) : apiError(500, "INTERNAL_ERROR", "ไม่สามารถส่ง feedback ได้"); }
}
export const OPTIONS = corsPreflightResponse;
