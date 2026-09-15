/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { Search, Mail, Calendar, Users, TrendingUp, Wifi, WifiOff, Sparkles, UserPlus, Clock, CheckCircle2, X, FolderKanban, AlertCircle } from "lucide-react";
import api from "@/lib/api";

interface UserProfile {
  userId: string;
  email: string;
  fullName?: string;
  role: string;
  createdAt: string;
  totalTasks?: number;
  completedTasks?: number;
  totalHours?: number;
  workspacesCount?: number;
}

interface Workspace {
  workspaceId: string;
  name: string;
  role?: string;
}

interface MemberRealStats {
  totalTasks: number;
  completedTasks: number;
  progress: number;
  totalHours: number;
  isOnline: boolean;
  isCurrentUser: boolean;
}

function CounterNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) {
      setDisplay(value);
      return;
    }
    ref.current = true;
    let start = 0;
    const duration = 700;
    const step = 16;
    const increment = value / (duration / step) || 0;
    if (value === 0) { setDisplay(0); return; }
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  return <span className="animate-count">{display}{suffix}</span>;
}

function CircularProgress({ pct, size = 50 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="url(#prog-grad)" strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="animate-ring"
        style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)" }}
      />
      <defs>
        <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MemberCard({ u, stats, idx }: { u: UserProfile; stats: MemberRealStats; idx: number }) {
  const { totalTasks, completedTasks, progress, totalHours, isOnline, isCurrentUser } = stats;
  const initials = u.fullName
    ? u.fullName.split(" ").filter(Boolean).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : u.email[0].toUpperCase();

  const delays = ["delay-0", "delay-50", "delay-100", "delay-150", "delay-200", "delay-250", "delay-300", "delay-350", "delay-400", "delay-500"];
  const delay = delays[idx % delays.length];

  return (
    <div className={`animate-stagger ${delay} group relative bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 cursor-pointer`}>
      {/* Online indicator */}
      {isOnline && (
        <span className="absolute top-4 right-4 flex h-2.5 w-2.5" title={isCurrentUser ? "Bạn đang trực tuyến" : "Đang trực tuyến"}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
      )}
      {!isOnline && (
        <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-slate-300" title="Ngoại tuyến" />
      )}

      {/* Avatar + Info */}
      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-indigo-500/20">
            {initials}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-sm text-slate-900 truncate">{u.fullName || u.email.split("@")[0]}</h4>
            {isCurrentUser && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">Bạn</span>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold mt-0.5 ${isOnline ? "text-emerald-600" : "text-slate-400"}`}>
            {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
            {isCurrentUser ? "Đang trực tuyến" : isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
          </span>
        </div>
      </div>

      {/* Role badge */}
      <div className="animate-pop-in delay-200 flex items-center justify-between">
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
          {u.role === "Admin" ? "⚡ Quản trị viên" : "👤 Thành viên nhóm"}
        </span>
        {totalHours > 0 && (
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <Clock size={11} className="text-indigo-500" />
            {totalHours.toFixed(1)}h
          </span>
        )}
      </div>

      {/* Real stats box */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-xl p-3 border border-slate-100">
        <div className="relative flex items-center justify-center">
          <CircularProgress pct={totalTasks > 0 ? progress : 0} size={50} />
          <span className="absolute text-[11px] font-black text-indigo-600">
            {totalTasks > 0 ? `${progress}%` : "0%"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 font-medium">Nhiệm vụ được giao</p>
          <p className="text-base font-black text-slate-900">
            {completedTasks}
            <span className="text-xs text-slate-400 font-medium">/{totalTasks}</span>
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            {totalTasks > 0 ? "đã hoàn thành" : "Chưa có nhiệm vụ"}
          </p>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -translate-y-1 group-hover:translate-y-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate flex-1 min-w-0" title={u.email}>
          <Mail size={11} className="shrink-0" />
          <span className="truncate">{u.email}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
          <Calendar size={11} />
          <span>{new Date(u.createdAt).toLocaleDateString("vi-VN")}</span>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [timeLogs, setTimeLogs] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch all real data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Current user
      const meRes = await api.get("/Auth/me").catch(() => null);
      if (meRes?.data?.userId) setCurrentUserId(meRes.data.userId);

      // 2. Workspaces
      const wsRes = await api.get("/Workspaces").catch(() => ({ data: [] }));
      const wsList: Workspace[] = Array.isArray(wsRes.data) ? wsRes.data : [];
      setWorkspaces(wsList);
      if (wsList.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(wsList[0].workspaceId);
      }

      // 3. Tasks across all workspaces
      const taskPromises = wsList.map(w =>
        api.get(`/Tasks?workspaceId=${w.workspaceId}&pageSize=200`)
          .then(r => Array.isArray(r.data?.items) ? r.data.items : [])
          .catch(() => [])
      );
      const allTaskArrays = await Promise.all(taskPromises);
      const allTasks = allTaskArrays.flat();
      setTasks(allTasks);

      // 4. Time logs across all workspaces
      const timeLogPromises = wsList.map(w =>
        api.get(`/TimeLogs?workspaceId=${w.workspaceId}`)
          .then(r => Array.isArray(r.data?.logs) ? r.data.logs : [])
          .catch(() => [])
      );
      const allTimeLogArrays = await Promise.all(timeLogPromises);
      const allTimeLogs = allTimeLogArrays.flat();
      setTimeLogs(allTimeLogs);

      // 5. Users
      const uRes = await api.get(`/Users${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      setUsers(Array.isArray(uRes.data) ? uRes.data : []);
    } catch (err) {
      console.error("Failed to load real team data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(fetchData, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  // Compute real stats per user
  const userStatsMap = useMemo(() => {
    const map: Record<string, MemberRealStats> = {};
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    users.forEach(u => {
      // Tasks owned or assigned
      const userTasks = tasks.filter(t => t.ownerId === u.userId);
      const totalUserTasks = u.totalTasks ?? userTasks.length;
      const completedUserTasks = u.completedTasks ?? userTasks.filter(t => t.status === "Done").length;
      const progress = totalUserTasks > 0 ? Math.round((completedUserTasks / totalUserTasks) * 100) : 0;

      // Real hours logged
      const userTimeLogs = timeLogs.filter(tl => tl.userId === u.userId);
      const totalHours = u.totalHours ?? userTimeLogs.reduce((sum, tl) => sum + (Number(tl.hours) || 0), 0);

      // Real activity detection: check if they logged time or created tasks in last 24h
      const hasRecentActivity = userTimeLogs.some(tl => new Date(tl.createdAt || tl.logDate) >= oneDayAgo)
        || userTasks.some(t => new Date(t.updatedAt || t.createdAt) >= oneDayAgo);

      const isCurrentUser = u.userId === currentUserId;
      const isOnline = isCurrentUser || hasRecentActivity;

      map[u.userId] = {
        totalTasks: totalUserTasks,
        completedTasks: completedUserTasks,
        progress,
        totalHours,
        isOnline,
        isCurrentUser,
      };
    });
    return map;
  }, [users, tasks, timeLogs, currentUserId]);

  // Team-wide aggregated real statistics
  const totalTeamHours = useMemo(() => {
    return timeLogs.reduce((sum, tl) => sum + (Number(tl.hours) || 0), 0);
  }, [timeLogs]);

  const totalTeamCompletedTasks = useMemo(() => {
    return tasks.filter(t => t.status === "Done").length;
  }, [tasks]);

  const avgTeamProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((totalTeamCompletedTasks / tasks.length) * 100);
  }, [tasks, totalTeamCompletedTasks]);

  const onlineCount = useMemo(() => {
    return Object.values(userStatsMap).filter(s => s.isOnline).length;
  }, [userStatsMap]);

  // Handle invite member
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedWorkspaceId) return;

    setInviting(true);
    setInviteMessage(null);
    try {
      const res = await api.post(`/Workspaces/${selectedWorkspaceId}/invite-by-email`, {
        email: inviteEmail.trim(),
      });
      setInviteMessage({ type: "success", text: res.data?.message || "Đã mời thành viên thành công!" });
      setInviteEmail("");
      fetchData();
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteMessage(null);
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Không thể mời thành viên. Vui lòng kiểm tra lại email hoặc quyền quản trị.";
      setInviteMessage({ type: "error", text: msg });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">

      {/* ── Hero Header ── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 px-8 py-8 shrink-0">
        {/* Animated orbs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/8 animate-orb blur-xl" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-violet-400/20 animate-orb delay-300 blur-lg" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-indigo-200 animate-float" />
              <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Quản lý nhân sự</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Thành viên nhóm</h2>
            <p className="text-indigo-200 text-sm mt-1">Theo dõi năng suất và hiệu suất thực tế của toàn đội ngũ</p>
          </div>

          {/* Real KPI pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: <Users size={14} />, label: "Tổng thành viên", value: users.length, suffix: " người", color: "bg-white/15" },
              { icon: <Wifi size={14} />, label: "Đang hoạt động", value: onlineCount, suffix: " người", color: "bg-emerald-400/20" },
              { icon: <TrendingUp size={14} />, label: "Tiến độ toàn nhóm", value: avgTeamProgress, suffix: "%", color: "bg-violet-400/20" },
            ].map((kpi, i) => (
              <div key={i} className={`animate-stagger delay-${i * 100} ${kpi.color} backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-white`}>
                <div className="flex items-center gap-2 text-white/70 text-xs mb-1">{kpi.icon}<span>{kpi.label}</span></div>
                <div className="text-xl font-black">
                  <CounterNumber value={kpi.value} suffix={kpi.suffix} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search + invite bar */}
        <div className="relative z-10 flex items-center gap-3 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60" size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Tìm kiếm thành viên theo tên, email..."
              className={`w-full pl-9 pr-4 py-2.5 bg-white/15 border border-white/25 rounded-full text-sm text-white placeholder-white/50 focus:outline-none focus:bg-white/25 focus:border-white/50 transition-all duration-300 ${searchFocused ? "shadow-lg shadow-indigo-900/30" : ""}`}
            />
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 rounded-full text-sm font-bold hover:bg-indigo-50 hover:shadow-lg hover:shadow-indigo-900/20 hover:-translate-y-0.5 transition-all duration-200 shrink-0"
          >
            <UserPlus size={15} />
            Mời thành viên
          </button>
        </div>
      </header>

      {/* ── Team Grid ── */}
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`animate-stagger delay-${i * 50} bg-white border border-slate-100 rounded-2xl p-5 h-52`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 animate-pulse rounded-full w-3/4" />
                    <div className="h-2.5 bg-slate-100 animate-pulse rounded-full w-1/2" />
                  </div>
                </div>
                <div className="h-2 bg-slate-100 animate-pulse rounded-full mb-3" />
                <div className="h-14 bg-slate-50 animate-pulse rounded-xl" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Users size={48} className="mb-4 animate-float opacity-30" />
            <p className="text-base font-bold">Không tìm thấy thành viên</p>
            <p className="text-sm mt-1">Thử từ khóa khác hoặc nhấn "Mời thành viên" để thêm người mới vào dự án</p>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div className="flex items-center gap-2 mb-6 animate-slide-up">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{users.length} thành viên</span>
              <div className="flex-1 h-px bg-slate-200" />
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {onlineCount} đang hoạt động
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  {users.length - onlineCount} ngoại tuyến
                </span>
              </div>
            </div>

            {/* Member Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {users.map((u, idx) => (
                <MemberCard
                  key={u.userId}
                  u={u}
                  stats={userStatsMap[u.userId] || {
                    totalTasks: 0,
                    completedTasks: 0,
                    progress: 0,
                    totalHours: 0,
                    isOnline: false,
                    isCurrentUser: false,
                  }}
                  idx={idx}
                />
              ))}
            </div>

            {/* Bottom Real Stats */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up delay-400 max-w-7xl mx-auto">
              {[
                {
                  icon: <Clock size={16} className="text-indigo-500" />,
                  label: "Tổng giờ ghi nhận",
                  value: `${totalTeamHours.toFixed(1)}h`,
                  sub: "Tổng giờ từ Time Log thực tế",
                },
                {
                  icon: <CheckCircle2 size={16} className="text-emerald-500" />,
                  label: "Task đã hoàn thành",
                  value: `${totalTeamCompletedTasks}`,
                  sub: `Trên tổng số ${tasks.length} nhiệm vụ`,
                },
                {
                  icon: <TrendingUp size={16} className="text-violet-500" />,
                  label: "Tiến độ trung bình",
                  value: `${avgTeamProgress}%`,
                  sub: "Tỉ lệ hoàn thành của dự án",
                },
                {
                  icon: <FolderKanban size={16} className="text-orange-500" />,
                  label: "Không gian làm việc",
                  value: `${workspaces.length}`,
                  sub: "Dự án đang tham gia",
                },
              ].map((stat, i) => (
                <div key={i} className={`animate-stagger delay-${(i + 4) * 100} bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md hover:border-indigo-200 transition-all duration-200`}>
                  <div className="flex items-center gap-2 mb-2">{stat.icon}<span className="text-xs text-slate-500">{stat.label}</span></div>
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">{stat.sub}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Invite Member Modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowInviteModal(false)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 z-10 animate-bounce-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Mời thành viên vào nhóm</h3>
                  <p className="text-xs text-slate-400">Gửi lời mời tham gia dự án qua email</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {inviteMessage && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 ${
                inviteMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {inviteMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{inviteMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Chọn dự án</label>
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 bg-white transition-all"
                  required
                >
                  {workspaces.map(w => (
                    <option key={w.workspaceId} value={w.workspaceId}>
                      {w.name} {w.role ? `(${w.role})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Địa chỉ Email</label>
                <input
                  type="email"
                  placeholder="nhanvien@congty.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim() || !selectedWorkspaceId}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all"
                >
                  {inviting ? "Đang gửi..." : "Gửi lời mời"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
