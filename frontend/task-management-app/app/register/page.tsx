/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { CheckCircle2, ChevronRight, Mail, Lock, User } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/Auth/register", { email, password, fullName });
      // Redirect to login after successful register
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
      setError(err.response?.data || "Đăng nhập Google thất bại (Vui lòng kiểm tra Client ID)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white flex-row-reverse">
      
      {/* Right side: Register Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative">
        <Link href="/welcome" className="absolute top-10 right-8 sm:right-16 lg:right-24 xl:right-32 flex items-center gap-2 group">
          <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">DoneIt<span className="text-indigo-600">.</span></span>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-white" />
          </div>
        </Link>

        <div className="w-full max-w-sm mx-auto mt-12">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Bắt đầu ngay hôm nay</h1>
          <p className="text-slate-500 font-medium mb-8">Tạo tài khoản miễn phí để trải nghiệm nền tảng.</p>

          <div className="mb-6 flex justify-center">
            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Đăng nhập Google thất bại")}
                useOneTap
                theme="outline"
                size="large"
                width="100%"
                text="signup_with"
              />
            ) : (
              <button
                type="button"
                onClick={() => setError("Vui lòng cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID trong file .env")}
                className="w-full flex items-center justify-center gap-3 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Đăng ký với Google
              </button>
            )}
          </div>

          <div className="relative flex items-center py-5">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-semibold">Hoặc đăng ký bằng Email</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Họ và Tên</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  required 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

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
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="Ít nhất 8 ký tự"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-indigo-600/20"
            >
              {loading ? "Đang xử lý..." : "Tạo tài khoản"} <ChevronRight size={18} />
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-600">
            Đã có tài khoản? <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700">Đăng nhập</Link>
          </p>
        </div>
      </div>

      {/* Left side: Graphic/Image */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 items-center justify-center overflow-hidden p-12">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-indigo-900 to-violet-900 opacity-95"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        
        <div className="relative z-10 w-full max-w-lg bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            Bước đầu tiên để làm chủ công việc.
          </h2>
          <p className="text-indigo-200 font-medium leading-relaxed mb-8">
            Chỉ mất 30 giây để thiết lập tài khoản. Sau đó, bạn sẽ có toàn bộ quyền kiểm soát các dự án, tiến độ và đội ngũ của mình.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CheckCircle2 size={14} />
              </div>
              <span className="text-sm font-semibold text-slate-300">Không cần thẻ tín dụng</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CheckCircle2 size={14} />
              </div>
              <span className="text-sm font-semibold text-slate-300">Bảo mật dữ liệu chuẩn doanh nghiệp</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
