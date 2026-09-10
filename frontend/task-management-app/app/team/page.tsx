"use client";

import React, { useEffect, useState } from "react";
import { Search, Mail, Calendar, User, MoreVertical } from "lucide-react";
import api from "@/lib/api";

interface UserProfile {
  userId: string;
  email: string;
  fullName?: string;
  role: string;
  createdAt: string;
}

export default function TeamPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/Users${search ? `?search=${encodeURIComponent(search)}` : ''}`);
        setUsers(res.data || []);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 300); // debounce search
    
    return () => clearTimeout(timeoutId);
  }, [search]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-tl-[2rem] border-l border-t border-slate-100 shadow-sm">
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Thành viên nhóm</h2>
          <p className="text-sm text-slate-500 font-medium">Danh sách các thành viên trong hệ thống</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm thành viên..." 
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-blue-500 w-[300px]"
            />
          </div>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">Đang tải danh sách thành viên...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Không tìm thấy thành viên nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map(u => (
              <div key={u.userId} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group relative">
                <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical size={20} />
                </button>
                <div className="w-20 h-20 bg-slate-200 rounded-full overflow-hidden mb-4 border-4 border-white shadow-sm flex items-center justify-center">
                  <User size={40} className="text-slate-400" />
                </div>
                <h4 className="font-bold text-lg text-slate-800 truncate w-full">{u.fullName || 'Người dùng ẩn'}</h4>
                <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full mt-1 mb-4">{u.role}</p>
                
                <div className="w-full space-y-2 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={14} className="shrink-0 text-slate-400" />
                    <span>Tham gia: {new Date(u.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
