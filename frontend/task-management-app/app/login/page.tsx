"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { CheckCircle2, ChevronRight, Mail, Lock } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setError(err.response?.data || "Đăng nhập thất bại");
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
      setError(err.response?.data || "Đăng nhập Google thất bại (Vui lòng kiểm tra Client ID)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      
      {/* Left side: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative">
        <Link href="/welcome" className="absolute top-10 left-8 sm:left-16 lg:left-24 xl:left-32 flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">DoneIt<span className="text-indigo-600">.</span></span>
        </Link>

        <div className="w-full max-w-sm mx-auto mt-12">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Chào mừng trở lại!</h1>
          <p className="text-slate-500 font-medium mb-8">Đăng nhập để tiếp tục quản lý dự án của bạn.</p>

          <div className="mb-6 flex justify-center">
            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Đăng nhập Google thất bại")}
                useOneTap
                theme="outline"
                size="large"
                width="100%"
                text="continue_with"
              />
            ) : (
              <button
                type="button"
                onClick={() => setError("Vui lòng cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID trong file .env")}
                className="w-full flex items-center justify-center gap-3 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Tiếp tục với Google
              </button>
            )}
          </div>

          <div className="relative flex items-center py-5">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-semibold">Hoặc đăng nhập với Email</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-bold text-slate-700">Mật khẩu</label>
                <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Quên mật khẩu?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"} <ChevronRight size={18} />
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-600">
            Chưa có tài khoản? <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-700">Đăng ký ngay</Link>
          </p>
        </div>
      </div>

      {/* Right side: Graphic/Image */}
      <div className="hidden lg:flex flex-1 relative bg-slate-50 items-center justify-center overflow-hidden p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 opacity-95"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        <div className="relative z-10 w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 shadow-2xl">
          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            Tối ưu hóa năng suất<br/>nhóm của bạn.
          </h2>
          <p className="text-indigo-100 font-medium leading-relaxed mb-8">
            DoneIt không chỉ là một công cụ, nó là nền tảng giúp đội ngũ của bạn giao tiếp, cộng tác và hoàn thành dự án đúng hạn một cách nghệ thuật nhất.
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500 bg-indigo-200"></div>
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500 bg-violet-300"></div>
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500 bg-fuchsia-200"></div>
            </div>
            <div className="text-sm font-bold text-white">
              +2,000 người dùng <br/><span className="text-indigo-200 font-medium text-xs">đang sử dụng nền tảng</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
