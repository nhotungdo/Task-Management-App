/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Layers, CheckCircle, BarChart2, GitBranch, Users } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';

const BENEFITS = [
  { icon: CheckCircle, text: "Không cần thẻ tín dụng" },
  { icon: BarChart2, text: "Gantt Chart & báo cáo đầy đủ" },
  { icon: GitBranch, text: "Quản lý phụ thuộc task thông minh" },
  { icon: Users, text: "Cộng tác nhóm không giới hạn" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự"); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/Auth/register", { email, password, fullName });
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/Auth/google", { credential: credentialResponse.credential });
      localStorage.setItem("token", res.data.token);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data || "Đăng nhập Google thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', sans-serif", background: "#fff" }}>

      {/* ── Left: Dark visual ── */}
      <div style={{ width: 480, background: "var(--sidebar-bg)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 56px", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: -100, left: -100, width: 300, height: 300, borderRadius: "50%", background: "rgba(0,82,204,0.08)" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 240, height: 240, borderRadius: "50%", background: "rgba(0,82,204,0.05)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <Link href="/welcome" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 48 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg, #0052cc, #0073e6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
              DoneIt<span style={{ color: "#4da6ff" }}>.</span>
            </span>
          </Link>

          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 12 }}>
              Bắt đầu trong<br />
              <span style={{ color: "#4da6ff" }}>30 giây</span>
            </h2>
            <p style={{ fontSize: 14, color: "#8fa3c0", lineHeight: 1.6 }}>
              Tạo tài khoản và ngay lập tức có thể tạo dự án, Gantt Chart và mời đồng đội tham gia.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {BENEFITS.map(b => (
              <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(0,82,204,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <b.icon size={14} color="#4da6ff" />
                </div>
                <span style={{ fontSize: 13, color: "#c8d6e8", fontWeight: 500 }}>{b.text}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "36px 0" }} />

          <div style={{ fontSize: 13, color: "#6b85a3" }}>
            Đã có tài khoản?{" "}
            <Link href="/login" style={{ color: "#4da6ff", fontWeight: 600, textDecoration: "none" }}>Đăng nhập tại đây</Link>
          </div>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 48 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#172b4d", marginBottom: 6 }}>Tạo tài khoản</h1>
          <p style={{ fontSize: 14, color: "#5e6c84", marginBottom: 24 }}>Miễn phí, không cần thẻ tín dụng</p>

          {/* Google */}
          <div style={{ marginBottom: 16 }}>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Đăng nhập Google thất bại")}
              useOneTap theme="outline" size="large" width="100%" text="signup_with" />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 12, color: "#97a0af", fontWeight: 500 }}>hoặc</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 4, fontSize: 13, color: "#c53030", marginBottom: 14, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5e6c84", display: "block", marginBottom: 5 }}>Họ và tên</label>
              <div style={{ position: "relative" }}>
                <User size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#97a0af" }} />
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                  className="gp-input" style={{ paddingLeft: 30 }} placeholder="Nguyễn Văn A" autoFocus />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5e6c84", display: "block", marginBottom: 5 }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#97a0af" }} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="gp-input" style={{ paddingLeft: 30 }} placeholder="name@company.com" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5e6c84", display: "block", marginBottom: 5 }}>Mật khẩu</label>
              <div style={{ position: "relative" }}>
                <Lock size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#97a0af" }} />
                <input type={showPwd ? "text" : "password"} required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                  className="gp-input" style={{ paddingLeft: 30, paddingRight: 36 }} placeholder="Ít nhất 6 ký tự" />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#97a0af", padding: 0 }}>
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <p style={{ fontSize: 11, color: "#97a0af", margin: "2px 0 4px" }}>
              Bằng cách đăng ký, bạn đồng ý với{" "}
              <a href="#" style={{ color: "#0052cc" }}>Điều khoản dịch vụ</a> và{" "}
              <a href="#" style={{ color: "#0052cc" }}>Chính sách bảo mật</a>
            </p>

            <button type="submit" disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", background: loading ? "#80a8e0" : "#0052cc", color: "#fff", border: "none", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s" }}>
              {loading ? "Đang tạo tài khoản..." : <>Tạo tài khoản <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
