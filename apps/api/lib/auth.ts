import { createHash, randomBytes } from "node:crypto";

import argon2 from "argon2";
import { cookies } from "next/headers";

import type { SessionUser } from "./authorization";
import { HttpError } from "./http";
import { prisma } from "./prisma";

export const sessionCookieName = "stroke_session";
const sessionLifetimeMs = 1000 * 60 * 60 * 8;

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !(await argon2.verify(user.passwordHash, password))) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }

  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: { userId: user.id, tokenHash: hashSessionToken(token), expiresAt: new Date(Date.now() + sessionLifetimeMs) },
  });

  return { token, user: { id: user.id, role: user.role, displayName: user.displayName } };
}

export async function requireSession(): Promise<SessionUser> {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) throw new HttpError(401, "UNAUTHENTICATED", "กรุณาเข้าสู่ระบบก่อนใช้งาน");

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date() || !session.user.isActive) {
    throw new HttpError(401, "UNAUTHENTICATED", "กรุณาเข้าสู่ระบบใหม่");
  }
  return { id: session.user.id, role: session.user.role, displayName: session.user.displayName };
}

export async function logout() {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({ where: { tokenHash }, include: { user: true } });
  await prisma.session.deleteMany({ where: { tokenHash } });
  if (!session) return null;
  return { id: session.user.id, role: session.user.role, displayName: session.user.displayName };
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: sessionLifetimeMs / 1000,
};
