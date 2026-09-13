/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-location-assign-relative-destination */
"use client";

import React, { useEffect, useState } from "react";
import { User, Lock, Bell, LogOut, Shield, Monitor, Key, Smartphone, Globe, CreditCard, ChevronRight, Upload, Camera } from "lucide-react";
import api from "@/lib/api";

const TABS = [
  { id: "profile", label: "Hồ sơ cá nhân", icon: User },
  { id: "security", label: "Bảo mật & Đăng nhập", icon: Shield },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "appearance", label: "Giao diện", icon: Monitor },
  { id: "billing", label: "Gói cước", icon: CreditCard },
];

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  
  // States for UI interactivity
  const [toast, setToast] = useState<{show: boolean, message: string}>({show: false, message: ""});
  const [theme, setTheme] = useState("light");
  const [color, setColor] = useState("blue");
  const [loading, setLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    api.get("/Auth/me").then(res => {
      setUser(res.data);
      setFullName(res.data?.fullName || "");
    }).catch(console.error);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const showToast = (message: string) => {
    setToast({show: true, message});
    setTimeout(() => setToast({show: false, message: ""}), 3000);
  };

  const handleSaveProfile = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      showToast("Đã lưu thông tin hồ sơ thành công!");
    }, 600);
  };

  const handleSavePassword = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast("Đã cập nhật mật khẩu mới!");
    }, 600);
  };

  const handleToggleNotification = (setting: string) => {
    showToast(`Đã cập nhật cài đặt: ${setting}`);
  };

  const handleChangeTheme = (newTheme: string) => {
    setTheme(newTheme);
    showToast(`Đã áp dụng chủ đề: ${newTheme}`);
  };

  const handleChangeColor = (newColor: string) => {
    setColor(newColor);
    showToast("Đã thay đổi màu chủ đạo hệ thống");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-tl-[2rem] border-l border-t border-slate-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] relative overflow-hidden">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="absolute top-6 right-1/2 translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg shadow-emerald-600/20 font-bold text-sm flex items-center gap-2">
            <Shield size={16} />
            {toast.message}
          </div>
        </div>
      )}
      
      {/* Premium Header */}
      <header className="px-10 py-8 shrink-0 bg-white/60 backdrop-blur-md border-b border-slate-200/60 z-10 sticky top-0">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Cài đặt hệ thống</h2>
        <p className="text-slate-500 font-medium mt-1">Quản lý tài khoản, bảo mật và tùy chỉnh trải nghiệm của bạn</p>
      </header>

      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-72 shrink-0 border-r border-slate-200/60 bg-white/30 backdrop-blur-sm p-6 overflow-y-auto custom-scrollbar">
          <nav className="space-y-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === tab.id 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                    : "text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                  <span>{tab.label}</span>
                </div>
                {activeTab === tab.id && <ChevronRight size={16} className="opacity-70" />}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-slate-200/60">
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 bg-red-50/50 hover:bg-red-100 rounded-xl transition-colors group"
            >
              <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Đăng xuất khỏi thiết bị</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow p-10 overflow-y-auto custom-scrollbar bg-white/40">
          <div className="max-w-3xl mx-auto">
            
            {activeTab === "profile" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 mb-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10"></div>
                  
                  <div className="relative flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative group cursor-pointer">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-1 shadow-md">
                          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                            <User size={48} className="text-slate-300" />
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                          <Camera size={24} className="text-white" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                          <Upload size={14} className="text-white" />
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-500">JPG, PNG (Tối đa 2MB)</p>
                    </div>

                    {/* Profile Form */}
                    <div className="flex-grow space-y-5 w-full">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Họ và tên</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:bg-white" 
                            defaultValue={user?.fullName || ''} 
                            placeholder="Nhập họ và tên..."
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vai trò</label>
                          <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed">
                            {user?.role || 'Thành viên'}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Địa chỉ Email</label>
                          <input 
                            type="email" 
                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed" 
                            defaultValue={user?.email || ''} 
                            readOnly 
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chức danh / Tiểu sử</label>
                          <textarea 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all hover:bg-white min-h-[100px] resize-y" 
                            placeholder="Ví dụ: Product Manager tại Tech Corp..."
                          ></textarea>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button 
                          onClick={handleSaveProfile}
                          disabled={loading}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-blue-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:-translate-y-0"
                        >
                          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                {/* Password Section */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Key size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Đổi mật khẩu</h3>
                      <p className="text-sm text-slate-500">Cập nhật mật khẩu để bảo vệ tài khoản</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Mật khẩu hiện tại</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Mật khẩu mới</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">Nhập lại mật khẩu mới</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                    </div>
                    <button 
                      onClick={handleSavePassword}
                      disabled={loading}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all mt-2 disabled:opacity-50"
                    >
                      {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                  </div>
                </div>

                {/* 2FA Section */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Smartphone size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Xác thực 2 bước (2FA)</h3>
                        <p className="text-sm text-slate-500">Thêm một lớp bảo mật phụ khi đăng nhập</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors">
                      Bật 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                      <Bell size={20} className="text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Cài đặt Thông báo</h3>
                      <p className="text-sm text-slate-500">Quản lý cách bạn nhận thông báo từ hệ thống</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">Email Thông báo</h4>
                        <p className="text-xs text-slate-500">Nhận email khi có người giao task hoặc nhắc đến bạn</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked onChange={() => handleToggleNotification("Email Thông báo")} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">Thông báo Đẩy (Push)</h4>
                        <p className="text-xs text-slate-500">Hiển thị thông báo ngay trên trình duyệt web</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked onChange={() => handleToggleNotification("Thông báo Đẩy (Push)")} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">Báo cáo Tuần</h4>
                        <p className="text-xs text-slate-500">Nhận email tổng kết công việc vào sáng Thứ 2</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" onChange={() => handleToggleNotification("Báo cáo Tuần")} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                      <Monitor size={20} className="text-pink-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Tùy chỉnh Giao diện</h3>
                      <p className="text-sm text-slate-500">Thay đổi màu sắc và chế độ hiển thị</p>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Chủ đề (Theme)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className={`border-2 rounded-xl p-1 cursor-pointer transition-colors ${theme === 'light' ? 'border-blue-600' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => handleChangeTheme('light')}>
                          <div className="bg-slate-50 rounded-lg h-24 flex items-center justify-center border border-slate-200">
                            <span className="text-sm font-bold text-slate-800">Sáng (Light)</span>
                          </div>
                        </div>
                        <div className={`border-2 rounded-xl p-1 cursor-pointer transition-colors ${theme === 'dark' ? 'border-blue-600' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => handleChangeTheme('dark')}>
                          <div className="bg-slate-900 rounded-lg h-24 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">Tối (Dark)</span>
                          </div>
                        </div>
                        <div className={`border-2 rounded-xl p-1 cursor-pointer transition-colors ${theme === 'system' ? 'border-blue-600' : 'border-slate-200 hover:border-slate-300'}`} onClick={() => handleChangeTheme('system')}>
                          <div className="bg-gradient-to-r from-slate-50 to-slate-900 rounded-lg h-24 flex items-center justify-center border border-slate-200">
                            <span className="text-sm font-bold text-slate-800 bg-white/80 px-2 py-1 rounded backdrop-blur-sm">Hệ thống</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Màu Chủ Đạo</h4>
                      <div className="flex gap-4">
                        <button onClick={() => handleChangeColor('blue')} className={`w-10 h-10 rounded-full bg-blue-600 transition-all flex items-center justify-center ${color === 'blue' ? 'ring-4 ring-blue-100' : 'hover:ring-4 hover:ring-blue-50'}`}>
                          {color === 'blue' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </button>
                        <button onClick={() => handleChangeColor('indigo')} className={`w-10 h-10 rounded-full bg-indigo-600 transition-all flex items-center justify-center ${color === 'indigo' ? 'ring-4 ring-indigo-100' : 'hover:ring-4 hover:ring-indigo-50'}`}>
                          {color === 'indigo' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </button>
                        <button onClick={() => handleChangeColor('emerald')} className={`w-10 h-10 rounded-full bg-emerald-600 transition-all flex items-center justify-center ${color === 'emerald' ? 'ring-4 ring-emerald-100' : 'hover:ring-4 hover:ring-emerald-50'}`}>
                          {color === 'emerald' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </button>
                        <button onClick={() => handleChangeColor('orange')} className={`w-10 h-10 rounded-full bg-orange-500 transition-all flex items-center justify-center ${color === 'orange' ? 'ring-4 ring-orange-100' : 'hover:ring-4 hover:ring-orange-50'}`}>
                          {color === 'orange' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </button>
                        <button onClick={() => handleChangeColor('pink')} className={`w-10 h-10 rounded-full bg-pink-500 transition-all flex items-center justify-center ${color === 'pink' ? 'ring-4 ring-pink-100' : 'hover:ring-4 hover:ring-pink-50'}`}>
                          {color === 'pink' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-green-400/20 to-transparent rounded-bl-full -z-0"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                        <CreditCard size={20} className="text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Gói cước hiện tại</h3>
                        <p className="text-sm text-slate-500">Quản lý hóa đơn và thanh toán</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center justify-between mb-8">
                      <div>
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-extrabold rounded-full mb-2 uppercase tracking-wider">Free Plan</span>
                        <h4 className="text-2xl font-black text-slate-800 mb-1">Cơ bản</h4>
                        <p className="text-sm text-slate-500">Tối đa 3 dự án và 5 thành viên.</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-slate-800">0đ<span className="text-base font-medium text-slate-400">/tháng</span></div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-bold">DoneIt Pro 🚀</h4>
                        <div className="text-2xl font-black text-yellow-400">99.000đ<span className="text-sm font-medium text-slate-300">/tháng</span></div>
                      </div>
                      <ul className="space-y-3 mb-8 text-sm text-slate-300">
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div> Không giới hạn dự án & thành viên</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div> Biểu đồ Gantt & Báo cáo nâng cao</li>
                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div> Hỗ trợ ưu tiên 24/7</li>
                      </ul>
                      <button className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(250,204,21,0.3)] hover:shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                        Nâng cấp ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      
      {/* Settings specific footer, or we can use a global footer */}
      <div className="shrink-0 border-t border-slate-200/60 bg-white/60 backdrop-blur-md px-8 py-4 flex items-center justify-between z-10">
        <p className="text-xs font-semibold text-slate-500">© 2026 DoneIt Inc. All rights reserved.</p>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
          <a href="#" className="hover:text-blue-600 transition-colors">Chính sách bảo mật</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Điều khoản dịch vụ</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Trợ giúp</a>
        </div>
      </div>
    </div>
  );
}
