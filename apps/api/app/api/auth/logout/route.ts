import { NextResponse } from "next/server";

import { logout, sessionCookieName } from "../../../../lib/auth";
import { audit } from "../../../../lib/audit";
import { apiError, corsPreflightResponse, HttpError, withCors } from "../../../../lib/http";

export async function POST() {
  try {
    const user = await logout();
    if (user) await audit(user.id, "AUTH_LOGOUT", "User", user.id, "ออกจากระบบสำเร็จ");
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookieName, "", { httpOnly: true, path: "/", maxAge: 0 });
    return withCors(response);
  } catch (error) {
    if (error instanceof HttpError) return apiError(error.status, error.code, error.message);
    return apiError(500, "INTERNAL_ERROR", "ไม่สามารถออกจากระบบได้ในขณะนี้");
  }
}

export const OPTIONS = corsPreflightResponse;
