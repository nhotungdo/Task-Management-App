"use client";

import React, { useEffect, useState } from "react";
import { User, Lock, Bell, LogOut } from "lucide-react";
import api from "@/lib/api";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.get("/Auth/me").then(res => setUser(res.data)).catch(console.error);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-tl-[2rem] border-l border-t border-slate-100 shadow-sm">
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cài đặt</h2>
          <p className="text-sm text-slate-500 font-medium">Quản lý cấu hình tài khoản của bạn</p>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-4xl grid grid-cols-12 gap-8">
          <div className="col-span-4 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 font-bold rounded-xl transition-colors">
              <User size={20} />
              <span>Hồ sơ cá nhân</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
              <Lock size={20} />
              <span>Đổi mật khẩu</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
              <Bell size={20} />
              <span>Thông báo</span>
            </button>
            <div className="pt-8 mt-8 border-t border-slate-100">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors">
                <LogOut size={20} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
          
          <div className="col-span-8 bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Thông tin cá nhân</h3>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center">
                <User size={40} className="text-slate-400" />
              </div>
              <div>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700">Tải ảnh lên</button>
                <p className="text-xs text-slate-500 mt-2">Định dạng JPG, PNG. Tối đa 2MB.</p>
              </div>
            </div>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Họ và tên</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium" defaultValue={user?.fullName || ''} readOnly />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                <input type="email" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-500" defaultValue={user?.email || ''} readOnly />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Vai trò</label>
                <input type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-500" defaultValue={user?.role || ''} readOnly />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
