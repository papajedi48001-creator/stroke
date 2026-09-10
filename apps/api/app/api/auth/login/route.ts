import { loginSchema } from "@stroke/shared";
import { NextResponse } from "next/server";

import { login, sessionCookieName, sessionCookieOptions } from "../../../../lib/auth";
import { audit } from "../../../../lib/audit";
import { apiError, corsPreflightResponse, HttpError, withCors } from "../../../../lib/http";

export async function POST(request: Request) {
  try {
    const input = loginSchema.safeParse(await request.json());
    if (!input.success) return apiError(422, "INVALID_INPUT", "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง");

    const result = await login(input.data.email, input.data.password);
    await audit(result.user.id, "AUTH_LOGIN", "User", result.user.id, "เข้าสู่ระบบสำเร็จ");

    const response = NextResponse.json({ user: result.user });
    response.cookies.set(sessionCookieName, result.token, sessionCookieOptions);
    return withCors(response);
  } catch (error) {
    if (error instanceof HttpError) return apiError(error.status, error.code, error.message);
    return apiError(500, "INTERNAL_ERROR", "ไม่สามารถเข้าสู่ระบบได้ในขณะนี้");
  }
}

export const OPTIONS = corsPreflightResponse;
