/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-location-assign-relative-destination */
"use client";

 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useEffect, useState, useRef } from "react";
import { User, Lock, Bell, LogOut, Shield, Monitor, Key, Smartphone, Globe, CreditCard, ChevronRight, Upload, Camera, Check, Zap, Star } from "lucide-react";
import api from "@/lib/api";

const TABS = [
  { id: "profile", label: "Hồ sơ cá nhân", icon: User, color: "text-indigo-600", bg: "bg-indigo-50" },
  { id: "security", label: "Bảo mật & Đăng nhập", icon: Shield, color: "text-violet-600", bg: "bg-violet-50" },
  { id: "notifications", label: "Thông báo", icon: Bell, color: "text-orange-600", bg: "bg-orange-50" },
  { id: "appearance", label: "Giao diện", icon: Monitor, color: "text-pink-600", bg: "bg-pink-50" },
  { id: "billing", label: "Gói cước", icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50" },
];

function AnimatedToggle({ defaultChecked, onChange, colorClass = "bg-indigo-500" }: { defaultChecked?: boolean; onChange?: () => void; colorClass?: string }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  const handle = () => { setOn(v => !v); onChange?.(); };
  return (
    <button
      onClick={handle}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ripple-effect ${
        on ? colorClass : "bg-slate-200"
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
        on ? "translate-x-6" : "translate-x-0"
      }`} />
    </button>
  );
}

function PasswordStrength({ value }: { value: string }) {
  const len = value.length;
  const hasUpper = /[A-Z]/.test(value);
  const hasNum = /[0-9]/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);
  const score = (len >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpecial ? 1 : 0);
  const labels = ["", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
  const colors = ["", "bg-red-500", "bg-amber-500", "bg-indigo-500", "bg-emerald-500"];
  const textColors = ["", "text-red-500", "text-amber-600", "text-indigo-600", "text-emerald-600"];
  if (!value) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-400 ${
            i <= score ? colors[score] : "bg-slate-200"
          }`} />
        ))}
      </div>
      {score > 0 && <span className={`text-[11px] font-bold ${textColors[score]}`}>{labels[score]}</span>}
    </div>
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
   
  const [activeTab, setActiveTab] = useState("profile");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [prevTab, setPrevTab] = useState("profile");
  const [tabKey, setTabKey] = useState(0);
  const [toast, setToast] = useState<{ show: boolean; message: string; type?: "success" | "error" }>({ show: false, message: "", type: "success" });
  const [theme, setTheme] = useState("light");
  const [color, setColor] = useState("indigo");
   
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [notifStates, setNotifStates] = useState({ email: true, push: true, weekly: false });

  useEffect(() => {
    api.get("/Auth/me").then(res => { setUser(res.data); }).catch(console.error);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3200);
  };

  const switchTab = (id: string) => {
    setPrevTab(activeTab);
    setActiveTab(id);
    setTabKey(k => k + 1);
  };

  const handleSaveProfile = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); showToast("Đã lưu thông tin hồ sơ thành công! ✨"); }, 700);
  };

  const handleSavePassword = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); showToast("Đã cập nhật mật khẩu mới! 🔒"); }, 700);
  };

  const COLORS = [
    { key: "indigo", bg: "bg-indigo-600", ring: "ring-indigo-200", label: "Indigo" },
    { key: "violet", bg: "bg-violet-600", ring: "ring-violet-200", label: "Tím" },
    { key: "emerald", bg: "bg-emerald-500", ring: "ring-emerald-200", label: "Xanh lá" },
    { key: "orange", bg: "bg-orange-500", ring: "ring-orange-200", label: "Cam" },
    { key: "pink", bg: "bg-pink-500", ring: "ring-pink-200", label: "Hồng" },
    { key: "cyan", bg: "bg-cyan-500", ring: "ring-cyan-200", label: "Lam" },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/60 relative overflow-hidden">

      {/* Toast */}
      {toast.show && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold ${
            toast.type === "success" ? "bg-indigo-600 text-white shadow-indigo-600/30" : "bg-red-600 text-white shadow-red-600/30"
          }`}>
            <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center animate-pop-in">
              {toast.type === "success" ? <Check size={13} /> : "!"}
            </span>
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-8 py-6 shrink-0 bg-white border-b border-slate-200/60 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/25 animate-pulse-glow">
            <Globe size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Cài đặt hệ thống</h2>
            <p className="text-slate-500 text-sm">Quản lý tài khoản, bảo mật và tùy chỉnh trải nghiệm</p>
          </div>
        </div>
      </header>

      <div className="flex-grow flex overflow-hidden">

        {/* Sidebar */}
        <div className="w-64 shrink-0 border-r border-slate-200/60 bg-white/60 backdrop-blur-sm p-5 overflow-y-auto animate-slide-up delay-100">
          <nav className="space-y-1">
            {TABS.map((tab, i) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`animate-stagger delay-${i * 50} w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 animate-pulse-glow"
                      : "text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-900 hover:translate-x-1"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                      isActive ? "bg-white/20" : `${tab.bg} group-hover:scale-110`
                    }`}>
                      <tab.icon size={15} className={isActive ? "text-white" : tab.color} />
                    </div>
                    <span>{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="opacity-70 animate-slide-right" />}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 pt-6 border-t border-slate-200/60">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 group hover:translate-x-1"
            >
              <div className="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 group-hover:scale-110 transition-all">
                <LogOut size={14} className="text-red-500" />
              </div>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow p-8 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <div key={`${activeTab}-${tabKey}`} className="max-w-2xl mx-auto animate-slide-right">

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-r from-indigo-500/8 to-violet-500/8" />
                  <div className="relative flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <div className="relative group cursor-pointer">
                        <div className="absolute inset-0 rounded-full animate-spin-slow" style={{ background: "conic-gradient(from 0deg, #6366f1, #8b5cf6, #6366f1)", padding: "2px" }}>
                          <div className="w-full h-full rounded-full bg-white" />
                        </div>
                        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                          <User size={40} className="text-indigo-300" />
                          <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-[2px]">
                            <Camera size={22} className="text-white" />
                          </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                          <Upload size={13} className="text-white" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">JPG, PNG (Tối đa 2MB)</p>
                    </div>

                    <div className="flex-grow w-full space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Họ và tên</label>
                          <input type="text" defaultValue={user?.fullName || ""} placeholder="Nhập họ và tên..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:bg-white transition-all duration-200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vai trò</label>
                          <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed">{user?.role || "Thành viên"}</div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                          <input type="email" defaultValue={user?.email || ""} readOnly
                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tiểu sử</label>
                          <textarea rows={3} placeholder="Ví dụ: Product Manager tại Tech Corp..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 hover:bg-white resize-y transition-all duration-200" />
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button onClick={handleSaveProfile} disabled={loading}
                          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-500/25 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0">
                          {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check size={15} />}
                          {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center animate-pop-in">
                      <Key size={20} className="text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Đổi mật khẩu</h3>
                      <p className="text-sm text-slate-500">Cập nhật mật khẩu để bảo vệ tài khoản</p>
                    </div>
                  </div>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Mật khẩu hiện tại</label>
                      <input type="password" placeholder="••••••••"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Mật khẩu mới</label>
                      <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" />
                      <PasswordStrength value={password} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Nhập lại mật khẩu mới</label>
                      <input type="password" placeholder="••••••••"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" />
                    </div>
                    <button onClick={handleSavePassword} disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-sm hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50">
                      {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Lock size={14} />}
                      {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center animate-pop-in delay-100">
                        <Smartphone size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Xác thực 2 bước (2FA)</h3>
                        <p className="text-sm text-slate-500">Thêm lớp bảo mật phụ khi đăng nhập</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 hover:scale-105 transition-all duration-200">
                      <Zap size={14} className="animate-pulse" /> Bật 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center animate-pop-in">
                    <Bell size={20} className="text-orange-500 animate-float" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Cài đặt Thông báo</h3>
                    <p className="text-sm text-slate-500">Quản lý cách nhận thông báo từ hệ thống</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {[
                    { key: "email" as const, title: "Email Thông báo", desc: "Nhận email khi có người giao task hoặc nhắc đến bạn", default: true },
                    { key: "push" as const, title: "Thông báo Đẩy (Push)", desc: "Hiển thị thông báo ngay trên trình duyệt web", default: true },
                    { key: "weekly" as const, title: "Báo cáo Tuần", desc: "Nhận email tổng kết công việc vào sáng Thứ 2", default: false },
                  ].map((item, i) => (
                    <div key={item.key} className={`animate-stagger delay-${i * 100} flex items-center justify-between py-5 ${
                      i < 2 ? "border-b border-slate-100" : ""
                    }`}>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-0.5">{item.title}</h4>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <AnimatedToggle
                        defaultChecked={item.default}
                        onChange={() => showToast(`Đã cập nhật: ${item.title}`)}
                        colorClass="bg-gradient-to-r from-indigo-500 to-violet-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center animate-pop-in">
                      <Monitor size={20} className="text-pink-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Tùy chỉnh Giao diện</h3>
                      <p className="text-sm text-slate-500">Thay đổi màu sắc và chế độ hiển thị</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Chủ đề (Theme)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: "light", label: "Sáng", preview: "bg-slate-50 border-slate-200", text: "text-slate-800" },
                          { id: "dark", label: "Tối", preview: "bg-slate-900", text: "text-white" },
                          { id: "system", label: "Hệ thống", preview: "bg-gradient-to-r from-slate-50 to-slate-900 border-slate-200", text: "text-slate-700" },
                        ].map(t => (
                          <button key={t.id} onClick={() => { setTheme(t.id); showToast(`Đã áp dụng chủ đề: ${t.label}`); }}
                            className={`border-2 rounded-2xl p-1.5 transition-all duration-200 hover:scale-105 ${
                              theme === t.id ? "border-indigo-600 shadow-md shadow-indigo-500/20 scale-105" : "border-slate-200 hover:border-slate-300"
                            }`}>
                            <div className={`${t.preview} rounded-xl h-20 flex items-center justify-center border`}>
                              <span className={`text-sm font-bold ${t.text} ${t.id === "system" ? "bg-white/80 px-2 py-0.5 rounded-lg" : ""}`}>{t.label}</span>
                            </div>
                            {theme === t.id && <div className="flex justify-center mt-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pop-in" /></div>}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Màu Chủ Đạo</h4>
                      <div className="flex gap-3 flex-wrap">
                        {COLORS.map(c => (
                          <button key={c.key} onClick={() => { setColor(c.key); showToast(`Đã đổi màu: ${c.label}`); }}
                            title={c.label}
                            className={`w-10 h-10 rounded-full ${c.bg} transition-all duration-200 hover:scale-110 flex items-center justify-center ${
                              color === c.key ? `ring-4 ${c.ring} scale-110` : "hover:shadow-lg"
                            }`}>
                            {color === c.key && <Check size={16} className="text-white animate-pop-in" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-bl from-emerald-100/60 to-transparent rounded-bl-full" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center animate-pop-in">
                        <CreditCard size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Gói cước hiện tại</h3>
                        <p className="text-sm text-slate-500">Quản lý hóa đơn và thanh toán</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between mb-6 hover:border-slate-300 transition-colors">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-black rounded-full mb-1.5 uppercase tracking-wider">Free Plan</span>
                        <h4 className="text-xl font-black text-slate-800 mb-0.5">Cơ bản</h4>
                        <p className="text-sm text-slate-500">Tối đa 3 dự án và 5 thành viên.</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-800">0đ<span className="text-sm font-medium text-slate-400">/tháng</span></div>
                      </div>
                    </div>

                    <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-2xl overflow-hidden">
                      <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                      <div className="absolute -top-8 -right-8 w-32 h-32 bg-yellow-400/10 rounded-full animate-orb" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2">
                            <Star size={18} className="text-yellow-400 animate-float" fill="currentColor" />
                            <h4 className="text-xl font-black">DoneIt Pro</h4>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-black text-yellow-400">99.000đ</div>
                            <div className="text-xs text-slate-400">/tháng</div>
                          </div>
                        </div>
                        <ul className="space-y-2.5 mb-6">
                          {[
                            "Không giới hạn dự án & thành viên",
                            "Biểu đồ tiến độ & Báo cáo nâng cao",
                            "Trợ lý AI tích hợp (không giới hạn)",
                            "Hỗ trợ ưu tiên 24/7",
                          ].map((feat, i) => (
                            <li key={i} className={`animate-stagger delay-${i * 100} flex items-center gap-2.5 text-sm text-slate-300`}>
                              <Check size={14} className="text-yellow-400 shrink-0" />
                              {feat}
                            </li>
                          ))}
                        </ul>
                        <button className="relative w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(250,204,21,0.5)] active:translate-y-0">
                          <Zap size={16} className="inline mr-2 animate-pulse" />
                          Nâng cấp ngay
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-200/60 bg-white/60 backdrop-blur-md px-8 py-3.5 flex items-center justify-between z-10">
        <p className="text-xs text-slate-400">© 2026 DoneIt Inc. All rights reserved.</p>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          {["Chính sách bảo mật", "Điều khoản dịch vụ", "Trợ giúp"].map(l => (
            <a key={l} href="#" className="hover:text-indigo-600 transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </div>
  );
}
