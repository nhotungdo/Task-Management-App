/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Layers, CheckCircle, BarChart2, Users, GitBranch } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';

const FEATURES = [
  { icon: BarChart2, text: "Gantt Chart & Báo cáo trực quan" },
  { icon: GitBranch, text: "Quản lý phụ thuộc nhiệm vụ" },
  { icon: Users, text: "Cộng tác nhóm thời gian thực" },
  { icon: CheckCircle, text: "Theo dõi tiến độ & thời gian" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/Auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data || "Email hoặc mật khẩu không đúng");
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

      {/* ── Left: Form ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 60px", maxWidth: 520 }}>
        
        {/* Logo */}
        <Link href="/welcome" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 48 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: "linear-gradient(135deg, #0052cc, #0073e6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Layers size={17} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#172b4d", letterSpacing: "-0.03em" }}>
            DoneIt<span style={{ color: "#0052cc" }}>.</span>
          </span>
        </Link>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#172b4d", marginBottom: 6 }}>Đăng nhập</h1>
        <p style={{ fontSize: 14, color: "#5e6c84", marginBottom: 28 }}>Tiếp tục quản lý dự án của bạn</p>

        {/* Google Login */}
        <div style={{ marginBottom: 20 }}>
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Đăng nhập Google thất bại")}
            useOneTap theme="outline" size="large" width="100%" text="continue_with" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          <span style={{ fontSize: 12, color: "#97a0af", fontWeight: 500 }}>hoặc</span>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 4, fontSize: 13, color: "#c53030", marginBottom: 16, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#5e6c84", display: "block", marginBottom: 6 }}>Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#97a0af" }} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="gp-input" style={{ paddingLeft: 32 }} placeholder="name@company.com" />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#5e6c84" }}>Mật khẩu</label>
              <a href="#" style={{ fontSize: 12, color: "#0052cc", textDecoration: "none", fontWeight: 500 }}>Quên mật khẩu?</a>
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#97a0af" }} />
              <input type={showPwd ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                className="gp-input" style={{ paddingLeft: 32, paddingRight: 36 }} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#97a0af", padding: 0 }}>
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", background: loading ? "#80a8e0" : "#0052cc", color: "#fff", border: "none", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginTop: 4, transition: "background 0.15s" }}>
            {loading ? "Đang xử lý..." : <>Đăng nhập <ArrowRight size={16} /></>}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 13, color: "#5e6c84", textAlign: "center" }}>
          Chưa có tài khoản?{" "}
          <Link href="/register" style={{ color: "#0052cc", fontWeight: 600, textDecoration: "none" }}>Đăng ký miễn phí</Link>
        </p>
      </div>

      {/* ── Right: Visual ── */}
      <div style={{ flex: 1, background: "var(--sidebar-bg)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 72px", position: "relative", overflow: "hidden" }}>
        
        {/* Background decoration */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(0,82,204,0.08)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(0,82,204,0.05)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(0,114,230,0.15)", borderRadius: 4, marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4da6ff" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#4da6ff", textTransform: "uppercase", letterSpacing: "0.06em" }}>Phiên bản 2.0</span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 12 }}>
              Quản lý dự án<br />
              <span style={{ color: "#4da6ff" }}>chuyên nghiệp</span>
            </h2>
            <p style={{ fontSize: 14, color: "#8fa3c0", lineHeight: 1.6 }}>
              Từ Gantt Chart đến Kanban, từ báo cáo đến cộng tác thời gian thực — tất cả trong một nền tảng.
            </p>
          </div>

          {/* Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FEATURES.map(f => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(0,82,204,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <f.icon size={16} color="#4da6ff" />
                </div>
                <span style={{ fontSize: 14, color: "#c8d6e8", fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div style={{ marginTop: 40, padding: "16px 18px", background: "rgba(255,255,255,0.05)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", gap: -8, marginBottom: 8 }}>
              {["#667eea","#f59e0b","#10b981","#ef4444"].map((c, i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: "2px solid #1e2a3b", marginLeft: i === 0 ? 0 : -8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                  {["A","B","C","D"][i]}
                </div>
              ))}
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "2px solid #1e2a3b", marginLeft: -8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#8fa3c0" }}>+2k</div>
            </div>
            <p style={{ fontSize: 12, color: "#8fa3c0", margin: 0 }}>Hơn <strong style={{ color: "#c8d6e8" }}>2,000 đội nhóm</strong> đang sử dụng DoneIt</p>
          </div>
        </div>
      </div>
    </div>
  );
}
