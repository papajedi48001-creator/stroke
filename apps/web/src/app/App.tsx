import { Link, Route, Routes } from "react-router-dom";
import { RoleRoute } from "../components/RoleRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { useAuth } from "../lib/auth";

function ParticipantHome() { const { user, logout } = useAuth(); return <main><h1>แผนดูแลตนเอง</h1><p>ยินดีต้อนรับ {user?.displayName}</p><Link to="/participant/emergency">สัญญาณฉุกเฉิน BE-FAST</Link><button onClick={() => void logout()}>ออกจากระบบ</button></main>; }
function NurseHome() { return <main><h1>ผู้เข้าร่วมที่ดูแล</h1><p>หน้ารายชื่อผู้เข้าร่วมจะแสดงหลังเชื่อม API พยาบาล</p></main>; }
function AdminHome() { return <main><h1>จัดการระบบ</h1><p>หน้าจัดการผู้ใช้และการมอบหมายจะพร้อมหลังเชื่อม API ผู้ดูแลระบบ</p></main>; }
export function App() { return <Routes><Route path="/login" element={<LoginPage />} /><Route path="/participant" element={<RoleRoute roles={["PARTICIPANT"]}><ParticipantHome /></RoleRoute>} /><Route path="/nurse" element={<RoleRoute roles={["NURSE"]}><NurseHome /></RoleRoute>} /><Route path="/admin" element={<RoleRoute roles={["ADMIN"]}><AdminHome /></RoleRoute>} /><Route path="*" element={<LoginPage />} /></Routes>; }
