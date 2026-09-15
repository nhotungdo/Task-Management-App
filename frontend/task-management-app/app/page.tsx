/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, Filter, Plus, Calendar, Clock, BarChart3, CheckCircle2, 
  AlertCircle, ChevronRight, X, ArrowUpRight, Sparkles, FolderOpen, MoreVertical
} from "lucide-react";
import { isToday, isAfter, isBefore, startOfDay } from "date-fns";
import { Doughnut } from "react-chartjs-2";
import { 
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement
} from "chart.js";
import api from "@/lib/api";
import CreateTaskModal from "@/components/CreateTaskModal";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

interface Workspace {
  workspaceId: string;
  name: string;
}

interface Task {
  taskId: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  ownerId?: string;
  description?: string;
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState("To Do");

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        let wsData, usersData, notifData, meData;
        try { wsData = (await api.get("/Workspaces")).data; } catch (e) { console.warn("Failed to load workspaces"); }
        try { usersData = (await api.get("/Users")).data; } catch (e) { console.warn("Failed to load users"); }
        try { notifData = (await api.get("/Notifications")).data; } catch (e) { console.warn("Failed to load notifications"); }
        try { meData = (await api.get("/Auth/me")).data; } catch (e) { console.warn("Failed to load me"); }

        if (meData) setCurrentUser(meData);

        if (wsData && wsData.length > 0) {
          setWorkspaces(wsData);
          setActiveWorkspaceId(wsData[0].workspaceId);
        }

        const uMap: Record<string, string> = {};
        if (usersData) {
          usersData.forEach((u: any) => {
            uMap[u.userId] = u.fullName || u.email || "Người dùng";
          });
        }
        setUsersMap(uMap);
        if (notifData) setNotifications(notifData);
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };
    fetchInitData();
  }, []);

  const fetchTasks = () => {
    if (activeWorkspaceId) {
      setLoading(true);
      api.get(`/Tasks?workspaceId=${activeWorkspaceId}`)
        .then(res => setTasks(res.data.items || []))
        .catch(() => console.error("Failed to load tasks"))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeWorkspaceId]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => e.dataTransfer.setData("taskId", taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;
    const taskToUpdate = tasks.find(t => t.taskId === taskId);
    if (!taskToUpdate || taskToUpdate.status === newStatus) return;
    setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.put(`/Tasks/${taskId}`, { ...taskToUpdate, status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      fetchTasks();
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "Done" ? "To Do" : "Done";
    setTasks(prev => prev.map(t => t.taskId === task.taskId ? { ...t, status: newStatus } : t));
    try {
      await api.put(`/Tasks/${task.taskId}`, { ...task, status: newStatus });
    } catch (error) {
      console.error("Failed to toggle task", error);
      fetchTasks();
    }
  };

  const openModalForStatus = (status: string) => {
    setModalStatus(status);
    setIsModalOpen(true);
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const todoTasks = filteredTasks.filter(t => t.status === "To Do");
  const inProgressTasks = filteredTasks.filter(t => t.status === "In Progress");
  const inReviewTasks = filteredTasks.filter(t => t.status === "In Review");
  const doneTasks = filteredTasks.filter(t => t.status === "Done");

  const today = startOfDay(new Date());
  const todayTasks = filteredTasks.filter(t => t.dueDate && isToday(new Date(t.dueDate)));
  const overdueTasks = filteredTasks.filter(t => t.dueDate && isBefore(new Date(t.dueDate), today) && t.status !== "Done");

  const totalTasks = filteredTasks.length;
  const completedTasks = doneTasks.length;
  const inProgressCount = inProgressTasks.length;
  const overdueCount = overdueTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const donutData = {
    labels: ["Hoàn thành", "Đang làm", "Cần làm"],
    datasets: [{
      data: totalTasks === 0 ? [0, 0, 100] : [completedTasks, inProgressCount, totalTasks - completedTasks - inProgressCount],
      backgroundColor: ["#22c55e", "#f59e0b", "#e2e8f0"],
      borderWidth: 0,
      cutout: "75%",
    }]
  };

  const priorityData = {
    high: filteredTasks.filter(t => t.priority === "High").length,
    medium: filteredTasks.filter(t => t.priority === "Medium").length,
    low: filteredTasks.filter(t => t.priority === "Low").length,
  };

  const prioLabel = (p: string) => {
    switch (p) {
      case "High": return "Cao";
      case "Medium": return "Trung bình";
      default: return "Thấp";
    }
  };

  const prioBadge = (p: string) => {
    switch (p) {
      case "High":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200/80";
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const userName = currentUser?.fullName ? currentUser.fullName.split(" ")[0] : "Bạn";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 relative">
      
      {/* ── Top Dashboard Header ── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-5 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {getGreeting()}, {userName} 👋
              </h1>
              {workspaces.length > 0 && (
                <div className="relative">
                  <select 
                    value={activeWorkspaceId || ""} 
                    onChange={(e) => setActiveWorkspaceId(e.target.value)} 
                    className="gp-select text-xs font-semibold py-1.5 pl-3 pr-8 bg-slate-50 border-slate-200 rounded-xl"
                  >
                    {workspaces.map(ws => (
                      <option key={ws.workspaceId} value={ws.workspaceId}>{ws.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hôm nay bạn có <span className="font-semibold text-slate-800">{todayTasks.length} nhiệm vụ</span> cần tập trung. Tiến độ hoàn thành tuần này đạt <span className="font-semibold text-indigo-600">{completionRate}%</span>.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Tìm việc, tag, mô tả..." 
                className="pl-8 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl w-48 sm:w-60 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
            <button 
              onClick={() => openModalForStatus("To Do")} 
              className="btn-primary text-xs py-2 px-4 shadow-sm"
            >
              <Plus size={15} /> Thêm việc
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Scrollable Area ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        
        {/* ── 4 KPI Statistics Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Total Tasks */}
          <div className="saas-card p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Tổng công việc</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-slate-900">{totalTasks}</h3>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-indigo-600">
                <ArrowUpRight size={13} />
                <span>↑ 12% so với tuần trước</span>
              </div>
            </div>
          </div>

          {/* Card 2: Completed */}
          <div className="saas-card p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Đã hoàn thành</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-slate-900">{completedTasks}</h3>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-600">
                <span>{completionRate}% tổng khối lượng</span>
              </div>
            </div>
          </div>

          {/* Card 3: In Progress */}
          <div className="saas-card p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Đang thực hiện</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-slate-900">{inProgressCount}</h3>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-amber-600">
                <span>{todoTasks.length} việc đang chờ xử lý</span>
              </div>
            </div>
          </div>

          {/* Card 4: Overdue */}
          <div className="saas-card p-5 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Quá hạn</span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-3xl font-extrabold text-slate-900">{overdueCount}</h3>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-rose-600">
                <span>{overdueCount > 0 ? "Cần tập trung giải quyết" : "Tất cả đúng hạn ✨"}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Main Content Grid: 2 Columns ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ── Left 2 Columns: Today's Tasks & Kanban Board ── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Today's Focus Card */}
            <div className="saas-card p-5 bg-white border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">Tiêu điểm hôm nay</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {todayTasks.length} việc hôm nay
                  </span>
                </div>
                <Link href="/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  Xem tất cả <ChevronRight size={13} />
                </Link>
              </div>

              {todayTasks.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {todayTasks.slice(0, 5).map(task => (
                    <div key={task.taskId} className="py-3 flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => toggleTaskStatus(task)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                            task.status === "Done"
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 hover:border-indigo-500 bg-white"
                          }`}
                        >
                          {task.status === "Done" && <CheckCircle2 size={13} />}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${task.status === "Done" ? "line-through text-slate-400" : "text-slate-800"}`}>
                            {task.title}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {task.dueDate ? `Hạn: Hôm nay` : "Chưa có hạn"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${prioBadge(task.priority)}`}>
                          {prioLabel(task.priority)}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                          {task.ownerId ? (usersMap[task.ownerId]?.charAt(0).toUpperCase() || "U") : "?"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Không có việc nào cần hoàn thành hôm nay. Bạn đã hoàn tất tất cả mục tiêu! ✨
                </div>
              )}
            </div>

            {/* Quick Kanban Board */}
            <div className="saas-card p-5 bg-white border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Bảng tiến độ công việc</h3>
                  <p className="text-xs text-slate-400">Kéo thả thẻ để cập nhật trạng thái nhanh</p>
                </div>
                {activeWorkspaceId && (
                  <Link 
                    href={`/workspaces/${activeWorkspaceId}`} 
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    Mở toàn bộ dự án <ChevronRight size={13} />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "To Do", label: "Cần làm", list: todoTasks, bg: "bg-slate-50", badgeBg: "bg-slate-200 text-slate-700" },
                  { id: "In Progress", label: "Đang làm", list: inProgressTasks, bg: "bg-amber-50/40", badgeBg: "bg-amber-100 text-amber-800" },
                  { id: "Done", label: "Hoàn thành", list: doneTasks, bg: "bg-emerald-50/40", badgeBg: "bg-emerald-100 text-emerald-800" },
                ].map(col => (
                  <div
                    key={col.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`rounded-xl p-3 flex flex-col min-h-[260px] ${col.bg} border border-slate-200/60`}
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="font-bold text-xs text-slate-700">{col.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                        {col.list.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[300px]">
                      {col.list.map(t => (
                        <div
                          key={t.taskId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, t.taskId)}
                          className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                              {t.title}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${prioBadge(t.priority)}`}>
                              {prioLabel(t.priority)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {t.dueDate ? new Date(t.dueDate).toLocaleDateString("vi-VN") : "Chưa có hạn"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => openModalForStatus(col.id)}
                      className="mt-3 w-full py-1.5 text-center text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg border border-dashed border-slate-300 transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={13} /> Thêm
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right Column: Analytics & Quick Stats ── */}
          <div className="space-y-6">
            
            {/* Donut Chart: Productivity Progress */}
            <div className="saas-card p-5 bg-white border border-slate-200 rounded-2xl">
              <h3 className="font-bold text-sm text-slate-900 mb-1">Tiến độ công việc</h3>
              <p className="text-xs text-slate-400 mb-4">Phân bổ trạng thái theo tỷ lệ</p>

              <div className="flex items-center justify-center py-2 relative">
                <div className="w-36 h-36 relative">
                  <Doughnut 
                    data={donutData} 
                    options={{ 
                      maintainAspectRatio: false, 
                      plugins: { legend: { display: false }, tooltip: { enabled: true } } 
                    }} 
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-slate-900">{completionRate}%</span>
                    <span className="text-[10px] text-slate-400 font-medium">Hoàn thành</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-400">Xong</span>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5">{completedTasks}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Đang làm</span>
                  <p className="text-xs font-bold text-amber-600 mt-0.5">{inProgressCount}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Chờ làm</span>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">{todoTasks.length}</p>
                </div>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="saas-card p-5 bg-white border border-slate-200 rounded-2xl">
              <h3 className="font-bold text-sm text-slate-900 mb-3">Mức độ ưu tiên</h3>
              
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] font-bold text-rose-700">Cao</span>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">{priorityData.high}</p>
                </div>
                <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] font-bold text-amber-700">Trung bình</span>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">{priorityData.medium}</p>
                </div>
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] font-bold text-indigo-700">Thấp</span>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">{priorityData.low}</p>
                </div>
              </div>

              <div className="h-2 rounded-full flex overflow-hidden bg-slate-100">
                <div style={{ width: `${totalTasks ? (priorityData.high / totalTasks) * 100 : 0}%` }} className="bg-rose-500" />
                <div style={{ width: `${totalTasks ? (priorityData.medium / totalTasks) * 100 : 0}%` }} className="bg-amber-500" />
                <div style={{ width: `${totalTasks ? (priorityData.low / totalTasks) * 100 : 0}%` }} className="bg-indigo-500" />
              </div>
            </div>

            {/* Quick Actions / Shortcuts */}
            <div className="saas-card p-5 bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-white border border-indigo-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-indigo-600" />
                <h4 className="font-bold text-xs text-slate-900">Mẹo Năng Suất</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tập trung giải quyết 1 task ưu tiên cao nhất trước 12:00 để duy trì đà làm việc năng suất trong ngày!
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ── Unified Task Creation Modal ── */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={() => fetchTasks()}
        defaultWorkspaceId={activeWorkspaceId || undefined}
        defaultStatus={modalStatus}
      />

    </div>
  );
}
