import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type User } from "../lib/auth";

export function RoleRoute({ roles, children }: { roles: User["role"][]; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p>กำลังตรวจสอบสถานะผู้ใช้…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />;
  return <>{children}</>;
}
export function homeForRole(role: User["role"]) { return role === "PARTICIPANT" ? "/participant" : role === "NURSE" ? "/nurse" : "/admin"; }
