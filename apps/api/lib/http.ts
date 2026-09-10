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
  return withCors(NextResponse.json({ error: { code, message } }, { status }));
}

export function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", process.env.WEB_ORIGIN ?? "http://localhost:5173");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Vary", "Origin");
  return response;
}

export function corsPreflightResponse() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return withCors(response);
}

export function forbidden(message = "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้") {
  return new HttpError(403, "FORBIDDEN", message);
}
