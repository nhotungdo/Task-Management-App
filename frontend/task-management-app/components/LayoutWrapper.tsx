/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Home, 
  FolderKanban, 
  CheckSquare, 
  CalendarDays, 
  BarChart2, 
  MessageCircle, 
  Users, 
  Settings,
  Bell,
  Search,
  ChevronDown,
  Briefcase,
  LogOut,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle2,
  Clock
} from "lucide-react";
import api from "@/lib/api";
import AiAssistantModal from "@/components/AiAssistantModal";

interface UserData {
  fullName?: string;
  email?: string;
  role?: string;
}

const NAV_ITEMS = [
  { href: "/", label: "Tổng quan", icon: Home },
  { href: "/tasks", label: "Công việc của tôi", icon: CheckSquare },
  { href: "/workspaces", label: "Dự án", icon: FolderKanban },
  { href: "/calendar", label: "Lịch biểu", icon: CalendarDays },
  { href: "/team", label: "Nhóm", icon: Users },
  { href: "/analytics", label: "Báo cáo", icon: BarChart2 },
  { href: "/messages", label: "Tin nhắn", icon: MessageCircle },
];

const BOTTOM_ITEMS = [
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifCount] = useState(3);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/welcome";

  useEffect(() => {
    if (!isAuthPage) {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/welcome");
        setIsLoading(false);
      } else {
        api.get("/Auth/me")
          .then(res => { setUser(res.data); })
          .catch(() => {
            localStorage.removeItem("token");
            router.push("/login");
          })
          .finally(() => { setIsLoading(false); });
      }
    } else {
      setIsLoading(false);
    }
  }, [pathname, router, isAuthPage]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (isAuthPage) return <>{children}</>;

  if (isLoading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>Đang tải không gian làm việc...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const initials = user?.fullName
    ? user.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">

      {/* ── Desktop Sidebar ── */}
      <aside 
        className={`hidden md:flex flex-col h-screen border-r border-slate-200/80 bg-white transition-all duration-300 relative z-20 ${
          collapsed ? "w-[72px]" : "w-[248px]"
        }`}
      >
        {/* Logo & Toggle */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden text-decoration-none">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-200">
              <Sparkles size={16} />
            </div>
            {!collapsed && (
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                DoneIt<span className="text-violet-500">.</span>
              </span>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all group ${
                  active
                    ? "bg-indigo-50/90 text-indigo-600 font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon 
                  size={18} 
                  className={`shrink-0 transition-colors ${
                    active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  }`} 
                />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="pt-3 pb-1">
            <div className="h-px bg-slate-100 mx-2" />
          </div>

          {/* Quick Workspaces link */}
          {!collapsed ? (
            <div className="px-2 pt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">Khu vực làm việc</p>
              <Link
                href="/workspaces"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Briefcase size={15} className="text-slate-400" />
                <span>Tất cả dự án</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/workspaces"
              title="Tất cả dự án"
              className="flex items-center justify-center py-2.5 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <Briefcase size={18} />
            </Link>
          )}
        </nav>

        {/* Bottom items */}
        <div className="p-2 border-t border-slate-100 space-y-1">
          {BOTTOM_ITEMS.map(item => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  active ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600 hover:bg-slate-50"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon size={16} className="text-slate-400 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            title={collapsed ? "Đăng xuất" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50/80 transition-colors ${
              collapsed ? "justify-center px-0" : ""
            }`}
          >
            <LogOut size={16} className="text-red-500 shrink-0" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>

        {/* User Card */}
        <div 
          className={`p-3 border-t border-slate-100 flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 transition-colors relative ${
            collapsed ? "justify-center" : ""
          }`}
          onClick={() => setUserMenuOpen(!userMenuOpen)}
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" title="Đang trực tuyến" />
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.fullName || user?.email || "Người dùng"}</p>
              <p className="text-[10px] text-slate-400 capitalize truncate">{user?.role || "Thành viên"}</p>
            </div>
          )}

          {!collapsed && <ChevronDown size={13} className="text-slate-400" />}

          {/* User popup dropdown */}
          {userMenuOpen && (
            <div 
              className="absolute bottom-full left-2 right-2 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.fullName || "Người dùng"}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <Link 
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 font-medium"
              >
                <User size={14} className="text-slate-400" /> Tài khoản & Bảo mật
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 font-medium"
              >
                <LogOut size={14} className="text-red-500" /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main View Area ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Top Header */}
        <header className="h-14 px-6 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 z-10">
          
          {/* Universal Search Bar */}
          <div className="flex-1 max-w-md relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm nhanh công việc, dự án... (Ctrl + K)"
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100/70 border border-transparent rounded-full focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            
            {/* Quick AI Trigger */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-700 hover:bg-indigo-100/70 border border-indigo-200/60 transition-all"
            >
              <Sparkles size={13} className="text-indigo-600" />
              <span>Trợ lý AI</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors relative ${
                  notifMenuOpen ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
                title="Thông báo"
              >
                <Bell size={17} />
                {notifCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {notifMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-800">Thông báo mới</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">3 chưa đọc</span>
                    </div>
                    <button className="text-[11px] font-semibold text-indigo-600 hover:underline">Đã đọc tất cả</button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    <div className="p-3.5 flex gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer bg-indigo-50/20">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">AD</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 leading-snug">
                          <strong>Quản trị viên</strong> đã giao cho bạn công việc <span className="font-semibold text-slate-900">&quot;Thiết kế giao diện SaaS&quot;</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock size={10} /> 10 phút trước</p>
                      </div>
                    </div>

                    <div className="p-3.5 flex gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0">SYS</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 leading-snug">
                          Dự án <span className="font-semibold text-slate-900">Task-Management-App</span> có 2 công việc sắp đến hạn.
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock size={10} /> 1 giờ trước</p>
                      </div>
                    </div>

                    <div className="p-3.5 flex gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
                        <CheckCircle2 size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 leading-snug">
                          Hải Quân đã hoàn thành công việc <span className="font-semibold text-slate-900">&quot;API Unit Tests&quot;</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Clock size={10} /> Hôm qua</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 border-t border-slate-100 text-center bg-slate-50/50">
                    <Link href="/settings" className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
                      Xem tất cả hoạt động
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Help Button */}
            <button 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Trợ giúp & Hướng dẫn"
            >
              <HelpCircle size={17} />
            </button>

            {/* Mobile menu trigger */}
            <div className="md:hidden flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            </div>

          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 overflow-hidden flex flex-col relative pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-around px-2">
        <Link href="/" className={`flex flex-col items-center gap-1 py-1 text-[11px] font-medium ${pathname === "/" ? "text-indigo-600 font-bold" : "text-slate-500"}`}>
          <Home size={18} />
          <span>Trang chủ</span>
        </Link>
        <Link href="/tasks" className={`flex flex-col items-center gap-1 py-1 text-[11px] font-medium ${pathname.startsWith("/tasks") ? "text-indigo-600 font-bold" : "text-slate-500"}`}>
          <CheckSquare size={18} />
          <span>Công việc</span>
        </Link>
        <Link href="/workspaces" className={`flex flex-col items-center gap-1 py-1 text-[11px] font-medium ${pathname.startsWith("/workspaces") ? "text-indigo-600 font-bold" : "text-slate-500"}`}>
          <FolderKanban size={18} />
          <span>Dự án</span>
        </Link>
        <Link href="/calendar" className={`flex flex-col items-center gap-1 py-1 text-[11px] font-medium ${pathname.startsWith("/calendar") ? "text-indigo-600 font-bold" : "text-slate-500"}`}>
          <CalendarDays size={18} />
          <span>Lịch</span>
        </Link>
        <button onClick={() => setIsAiModalOpen(true)} className="flex flex-col items-center gap-1 py-1 text-[11px] font-medium text-indigo-600">
          <Sparkles size={18} />
          <span>Trợ lý AI</span>
        </button>
      </div>

      {/* ── Floating AI Assistant Trigger Button (Bottom Right) ── */}
      <button
        onClick={() => setIsAiModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        <Sparkles size={15} className="animate-pulse" />
        <span>✨ Trợ lý AI</span>
      </button>

      {/* AI Assistant Modal */}
      <AiAssistantModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
      />

    </div>
  );
}
