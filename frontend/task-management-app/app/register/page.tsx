"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Settings } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/Auth/register", { fullName, email, password });
      if (res.data) {
        // Redirect to login on successful registration
        router.push("/login?registered=true");
      }
    } catch (err: unknown) {
      const errorMsg = err && typeof err === 'object' && 'response' in err
        ? ((err as Record<string, unknown>).response as Record<string, string>)?.data || "Đăng ký thất bại."
        : "Đăng ký thất bại. Vui lòng thử lại sau.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center">
            <Settings size={28} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Đăng ký tài khoản</h1>
        <p className="text-sm text-text-muted text-center mb-8">Tạo tài khoản mới để tham gia Workspace.</p>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-text-main mb-1">Họ và Tên</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-main mb-1">Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-main mb-1">Mật khẩu</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-main mb-1">Xác nhận mật khẩu</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-bold mt-4 hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-text-muted">
          Đã có tài khoản? <Link href="/login" className="text-primary font-bold">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
