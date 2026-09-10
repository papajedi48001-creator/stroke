import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function forbidden(message = "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้") {
  return new HttpError(403, "FORBIDDEN", message);
}
