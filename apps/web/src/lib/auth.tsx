import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";

export type User = { id: string; role: "PARTICIPANT" | "NURSE" | "ADMIN"; displayName: string };
type AuthState = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<User>; logout: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { api<{ user: User }>("/api/auth/me").then(({ user }) => setUser(user)).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  const login = async (email: string, password: string) => { const result = await api<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); setUser(result.user); return result.user; };
  const logout = async () => { await api("/api/auth/logout", { method: "POST" }); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const auth = useContext(AuthContext); if (!auth) throw new Error("useAuth must be used within AuthProvider"); return auth; }
