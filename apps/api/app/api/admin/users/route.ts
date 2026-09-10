import { NextResponse } from "next/server";
import { requireSession } from "../../../../lib/auth";
import { requireRole } from "../../../../lib/authorization";
import { apiError, corsPreflightResponse, HttpError, withCors } from "../../../../lib/http";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    requireRole(await requireSession(), ["ADMIN"]);
    const users = await prisma.user.findMany({ select: { id: true, email: true, displayName: true, role: true, isActive: true, createdAt: true, participant: { select: { id: true } } }, orderBy: { createdAt: "desc" } });
    return withCors(NextResponse.json({ users }));
  } catch (error) { return error instanceof HttpError ? apiError(error.status, error.code, error.message) : apiError(500, "INTERNAL_ERROR", "ไม่สามารถโหลดรายชื่อผู้ใช้ได้"); }
}
export const OPTIONS = corsPreflightResponse;
