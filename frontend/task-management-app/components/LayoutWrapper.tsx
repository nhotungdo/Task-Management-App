"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Settings, 
  Home, 
  FolderKanban, 
  CheckSquare, 
  CalendarDays, 
  BarChart2, 
  FileText, 
  MessageCircle, 
  Users, 
  Rocket,
  ChevronDown
} from "lucide-react";
import api from "@/lib/api";

interface UserData {
  fullName?: string;
  role?: string;
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (pathname !== "/login" && pathname !== "/register" && pathname !== "/welcome") {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/welcome");
        setIsLoading(false);
      } else {
        // Fetch user info
        api.get("/Auth/me")
          .then(res => {
            setUser(res.data);
          })
          .catch(() => {
            localStorage.removeItem("token");
            router.push("/login");
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    } else {
      setIsLoading(false);
    }
  }, [pathname, router]);

  if (pathname === "/login" || pathname === "/register" || pathname === "/welcome") {
    return <>{children}</>;
  }

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#f3f4f6]">Đang tải...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f3f4f6]">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white flex flex-col h-full shadow-[2px_0_10px_rgba(0,0,0,0.02)] flex-shrink-0">
        <div className="p-6 flex items-center gap-3">
          <Settings size={28} className="text-slate-800" />
          <h1 className="text-xl font-bold">Workspace</h1>
        </div>
        
        <nav className="flex-grow overflow-y-auto px-4 py-2 space-y-1">
          <Link href="/" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === '/' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Home size={20} />
            <span className="font-semibold text-sm">Tổng quan</span>
          </Link>
          <Link href="/workspaces" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === '/workspaces' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <FolderKanban size={20} />
            <span className="font-semibold text-sm">Dự án</span>
          </Link>
          <Link href="/tasks" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === '/tasks' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <CheckSquare size={20} />
            <span className="font-semibold text-sm">Công việc</span>
          </Link>
          <Link href="/calendar" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === '/calendar' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <CalendarDays size={20} />
            <span className="font-semibold text-sm">Lịch</span>
          </Link>
          <Link href="/analytics" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === '/analytics' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <BarChart2 size={20} />
            <span className="font-semibold text-sm">Phân tích</span>
          </Link>
          <Link href="/documents" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === '/documents' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <FileText size={20} />
            <span className="font-semibold text-sm">Tài liệu</span>
          </Link>
          <Link href="/messages" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === '/messages' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <MessageCircle size={20} />
            <span className="font-semibold text-sm">Tin nhắn</span>
          </Link>
          <Link href="/team" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === '/team' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Users size={20} />
            <span className="font-semibold text-sm">Nhóm</span>
          </Link>
          <Link href="/settings" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${pathname === '/settings' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Settings size={20} />
            <span className="font-semibold text-sm">Cài đặt</span>
          </Link>
        </nav>

        <div className="p-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600 shadow-sm">
              <Rocket size={20} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">Nâng cấp gói</h4>
            <p className="text-xs text-slate-500 mb-3">Mở khóa tính năng premium</p>
            <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-xs font-bold hover:bg-blue-700 transition-colors">
              Nâng cấp ngay
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden relative border-2 border-white">
              {/* Fake Avatar */}
              <div className="w-full h-full bg-orange-200"></div>
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">{user?.fullName || 'Đang tải...'}</p>
              <p className="text-xs text-slate-500">{user?.role || 'Product Designer'}</p>
            </div>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        {children}
      </main>
    </div>
  );
}
