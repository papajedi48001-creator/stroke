import { NextResponse } from "next/server";

import { requireSession } from "../../../../lib/auth";
import { apiError, corsPreflightResponse, HttpError, withCors } from "../../../../lib/http";

export async function GET() {
  try {
    return withCors(NextResponse.json({ user: await requireSession() }));
  } catch (error) {
    if (error instanceof HttpError) return apiError(error.status, error.code, error.message);
    return apiError(500, "INTERNAL_ERROR", "ไม่สามารถตรวจสอบสถานะผู้ใช้ได้ในขณะนี้");
  }
}

export const OPTIONS = corsPreflightResponse;
