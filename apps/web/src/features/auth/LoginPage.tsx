import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { homeForRole } from "../../components/RoleRoute";
import { useAuth } from "../../lib/auth";

export function LoginPage() {
  const { user, login } = useAuth(); const navigate = useNavigate(); const [error, setError] = useState("");
  if (user) return <Navigate to={homeForRole(user.role)} replace />;
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); try { const loggedIn = await login(String(form.get("email")), String(form.get("password"))); navigate(homeForRole(loggedIn.role)); } catch (e) { setError(e instanceof Error ? e.message : "เข้าสู่ระบบไม่สำเร็จ"); } }
  return <main><h1>เข้าสู่ระบบ</h1><form onSubmit={submit}><label>อีเมล<input name="email" type="email" required /></label><label>รหัสผ่าน<input name="password" type="password" minLength={12} required /></label>{error && <p role="alert">{error}</p>}<button type="submit">เข้าสู่ระบบ</button></form></main>;
}
