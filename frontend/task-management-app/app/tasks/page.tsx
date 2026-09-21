/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { isBefore, isToday, isTomorrow, isAfter, addDays, startOfDay, format } from "date-fns";
import { CheckCircle2, Clock, AlertCircle, CalendarClock, FolderOpen, ChevronRight, Sparkles, Target, Plus, Tag as TagIcon, Search, LayoutGrid, List } from "lucide-react";
import api from "@/lib/api";
import CreateTaskModal from "@/components/CreateTaskModal";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, PRIORITY_DOTS } from "@/lib/constants";

interface Tag {
  tagId: string;
  name: string;
  color: string;
}

interface Task {
  taskId: string;
  title: string;
  status: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  progress: number;
  workspaceId?: string;
  workspaceName?: string;
  tags?: Tag[];
}

// Removed inline constants

function safeDate(d?: string | null): string {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime()) || dt.getFullYear() < 1970) return "";
    return format(dt, "dd/MM");
  } catch { return ""; }
}

function CounterKPI({ target, label, color, icon, delay }: { target: number; label: string; color: string; icon: React.ReactNode; delay: string }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || target === 0) { setVal(target); return; }
    started.current = true;
    const duration = 700;
    const step = 16;
    const inc = target / (duration / step);
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(cur));
    }, step);
    return () => clearInterval(t);
  }, [target]);

  return (
    <div className={`animate-stagger ${delay} group ${color} rounded-2xl p-4 text-center hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/10 border border-white/50 transition-all duration-300 cursor-default backdrop-blur-sm`}>
      <div className="flex items-center justify-center mb-2">{icon}</div>
      <p className="text-3xl font-black text-slate-900 drop-shadow-sm">{val}</p>
      <p className="text-xs text-slate-500 mt-1 font-semibold">{label}</p>
    </div>
  );
}

function TaskCard({ task, workspaceNames, cardIdx, onTaskClick }: { task: Task; workspaceNames: Record<string, string>; cardIdx: number; onTaskClick: (id: string) => void }) {
  const wsName = task.workspaceId ? workspaceNames[task.workspaceId] : null;
  const today = startOfDay(new Date());
  const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), today) && task.status !== "Done";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const isDueTomorrow = task.dueDate && isTomorrow(new Date(task.dueDate));
  const delays = ["delay-0", "delay-50", "delay-100", "delay-150", "delay-200", "delay-250", "delay-300", "delay-350", "delay-400"];
  const delayClass = delays[cardIdx % delays.length];

  return (
    <div onClick={() => onTaskClick(task.taskId)}>
      <div className={`animate-stagger ${delayClass} group bg-white rounded-2xl p-4 border hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer
        ${isOverdue ? "border-red-200 animate-overdue hover:shadow-red-500/10" : "border-slate-200 hover:border-indigo-200 hover:shadow-indigo-500/10"}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200
              ${task.status === "Done" ? "bg-emerald-500 border-emerald-500 scale-110" : "border-slate-300 group-hover:border-indigo-400 group-hover:scale-110"}`}>
              {task.status === "Done" && <CheckCircle2 size={11} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold text-sm leading-snug transition-colors duration-200 ${
                task.status === "Done" ? "line-through text-slate-400" : "text-slate-800 group-hover:text-indigo-700"
              }`}>{task.title}</h4>
              {wsName && (
                <div className="flex items-center gap-1 mt-1">
                  <FolderOpen size={10} className="text-slate-400" />
                  <span className="text-[11px] text-slate-400">{wsName}</span>
                </div>
              )}
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 shrink-0 mt-0.5 transition-all duration-200 group-hover:translate-x-0.5" />
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border animate-pop-in ${PRIORITY_COLORS[task.priority] ?? "bg-slate-50 text-slate-500 border-slate-200"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOTS[task.priority] ?? "bg-slate-400"}`} />
              {PRIORITY_LABELS[task.priority] || task.priority}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] ?? ""}`}>
              {STATUS_LABELS[task.status] || task.status}
            </span>
            {(task.tags ?? []).slice(0, 1).map(tag => (
              <span key={tag.tagId} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: (tag.color || "#6B7280") + "15", color: tag.color }}>
                {tag.name}
              </span>
            ))}
          </div>
          {task.dueDate && safeDate(task.dueDate) && (
            <span className={`text-xs font-bold flex items-center gap-1 ${
              isOverdue ? "text-red-500" : isDueToday ? "text-orange-500" : isDueTomorrow ? "text-amber-500" : "text-slate-400"
            }`}>
              <CalendarClock size={11} />
              {isOverdue ? "Quá hạn · " : isDueToday ? "Hôm nay · " : isDueTomorrow ? "Ngày mai · " : ""}
              {safeDate(task.dueDate)}
            </span>
          )}
        </div>

        {task.progress > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-progress"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



function ListView({ tasks, workspaceNames, onTaskClick }: { tasks: Task[], workspaceNames: Record<string, string>, onTaskClick: (id: string) => void }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
        <span className="text-4xl mb-3 animate-float inline-block">📭</span>
        <p className="text-base font-semibold text-slate-700">Không tìm thấy công việc nào</p>
        <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-slide-up">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider">
            <th className="px-5 py-3.5 font-bold">Tên công việc</th>
            <th className="px-5 py-3.5 font-bold">Dự án</th>
            <th className="px-5 py-3.5 font-bold">Trạng thái</th>
            <th className="px-5 py-3.5 font-bold">Ưu tiên</th>
            <th className="px-5 py-3.5 font-bold">Hạn chót</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task, i) => (
            <tr key={task.taskId} onClick={() => onTaskClick(task.taskId)} className="hover:bg-slate-50 transition-colors group cursor-pointer" style={{ animationDelay: `${i * 30}ms` }}>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${task.status === 'Done' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                    {task.status === "Done" && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <span className={`font-semibold text-xs transition-colors ${task.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-800 group-hover:text-indigo-600'}`}>{task.title}</span>
                </div>
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-500 font-medium">
                 {workspaceNames[task.workspaceId || ""] || "N/A"}
              </td>
              <td className="px-5 py-3.5">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[task.status] ?? ""}`}>{STATUS_LABELS[task.status] || task.status}</span>
              </td>
              <td className="px-5 py-3.5">
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${PRIORITY_COLORS[task.priority] ?? "bg-slate-50 text-slate-500 border-slate-200"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOTS[task.priority] ?? "bg-slate-400"}`} />
                  {PRIORITY_LABELS[task.priority] || task.priority}
                </span>
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-500 font-medium">
                {safeDate(task.dueDate) || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import KanbanBoard from "@/components/KanbanBoard";

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspaceNames, setWorkspaceNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "High" | "Medium" | "Low">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "High" | "Medium" | "Low">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const wsRes = await api.get("/Workspaces");
      const wsData = wsRes.data as { workspaceId: string; name: string }[];
      const namesMap: Record<string, string> = {};
      wsData.forEach(w => { namesMap[w.workspaceId] = w.name; });
      setWorkspaceNames(namesMap);
      const taskPromises = wsData.map(w =>
        api.get(`/Tasks?workspaceId=${w.workspaceId}&pageSize=200`)
          .then(r => (r.data.items || []).map((t: any) => ({ ...t, workspaceId: w.workspaceId, workspaceName: w.name })))
          .catch(() => [])
      );
      const allTaskArrays = await Promise.all(taskPromises);
      setTasks(allTaskArrays.flat() as Task[]);
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const today = startOfDay(new Date());
  const inSevenDays = addDays(today, 7);
  const filtered = filter === "all" ? tasks : tasks.filter(t => t.priority === filter);

  const handleFilter = (f: "all" | "High" | "Medium" | "Low") => {
    setActiveFilter(f);
    setFilter(f);
  };

  const finalFiltered = filtered.filter(t => 
    !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const overdue = finalFiltered.filter(t => t.dueDate && isBefore(new Date(t.dueDate), today) && t.status !== "Done");
  const dueToday = finalFiltered.filter(t => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "Done");
  const upcoming = finalFiltered.filter(t => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    return isAfter(due, today) && isBefore(due, inSevenDays) && !isToday(due) && t.status !== "Done";
  });
  const noDueDate = finalFiltered.filter(t => !t.dueDate && t.status !== "Done");
  const completed = finalFiltered.filter(t => t.status === "Done");
  const totalPending = overdue.length + dueToday.length + upcoming.length + noDueDate.length;

  const tasksByStatus: Record<string, Task[]> = {
    "To Do": [],
    "In Progress": [],
    "In Review": [],
    "Done": []
  };
  
  finalFiltered.forEach(t => {
    if (tasksByStatus[t.status]) {
      tasksByStatus[t.status].push(t);
    } else {
      tasksByStatus["To Do"].push(t); // fallback
    }
  });

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center animate-slide-up">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <Sparkles size={20} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
        </div>
        <p className="text-slate-600 font-bold">Đang tải công việc của bạn...</p>
        <p className="text-slate-400 text-sm mt-1">Vui lòng chờ trong giây lát</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 z-10">
        <div className="px-8 pt-6 pb-5">
          <div className="flex items-end justify-between mb-5">
            <div className="animate-slide-up">
              <div className="flex items-center gap-2 mb-1">
                <Target size={16} className="text-indigo-500 animate-pulse" />
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Năng suất cá nhân</span>
              </div>
              <h1 className="text-3xl font-black bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">Công việc của tôi</h1>
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-bold text-slate-700">{totalPending}</span> việc cần làm ·
                <span className="font-bold text-emerald-600 ml-1">{completed.length}</span> hoàn thành
              </p>
            </div>

            <div className="flex flex-col items-end gap-3 animate-slide-up delay-100">
              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm công việc..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-xs font-medium text-slate-700 outline-none transition-all w-56 placeholder:text-slate-400"
                  />
                </div>

                {/* Add Task Button */}
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Thêm công việc</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1 border border-slate-200/50">
                  <button
                    onClick={() => setViewMode("kanban")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                      viewMode === "kanban" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <LayoutGrid size={13} /> Dạng Bảng
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                      viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <List size={13} /> Danh sách
                  </button>
                </div>

                <div className="w-px h-6 bg-slate-200" />

                {/* Filter pills */}
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1 border border-slate-200/50">
                  {(["all", "High", "Medium", "Low"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => handleFilter(f)}
                      className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                        activeFilter === f ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                      }`}
                    >
                      {f === "all" ? "Tất cả" : f === "High" ? "🔴 Cao" : f === "Medium" ? "🟡 Trung bình" : "🔵 Thấp"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Counter Cards */}
          <div className="grid grid-cols-4 gap-3">
            <CounterKPI target={overdue.length} label="Quá hạn" color="bg-red-50" delay="delay-0"
              icon={<AlertCircle size={18} className={overdue.length > 0 ? "text-red-500 animate-bounce" : "text-red-300"} />} />
            <CounterKPI target={dueToday.length} label="Hôm nay" color="bg-orange-50" delay="delay-100"
              icon={<CalendarClock size={18} className={dueToday.length > 0 ? "text-orange-500 animate-pulse" : "text-orange-300"} />} />
            <CounterKPI target={upcoming.length} label="7 ngày tới" color="bg-amber-50" delay="delay-200"
              icon={<Clock size={18} className="text-amber-500" />} />
            <CounterKPI target={completed.length} label="Hoàn thành" color="bg-emerald-50" delay="delay-300"
              icon={<CheckCircle2 size={18} className={completed.length > 0 ? "text-emerald-500 animate-pop-in" : "text-emerald-300"} />} />
          </div>
        </div>
      </div>

      {/* ── Content Sections ── */}
      <div className="px-8 py-6 h-full min-h-[500px]">
        {viewMode === "kanban" ? (
          <KanbanBoard 
            tasksByStatus={tasksByStatus} 
            workspaceNames={workspaceNames} 
            onTaskClick={setSelectedTaskId} 
            onTaskMove={async (taskId, newStatus) => {
              const taskToUpdate = tasks.find(t => t.taskId === taskId);
              if (!taskToUpdate || taskToUpdate.status === newStatus) return;
              // Optimistic update
              setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, status: newStatus } : t));
              try {
                await api.put(`/Tasks/${taskId}`, { ...taskToUpdate, status: newStatus });
              } catch {
                fetchData(); // revert on error
              }
            }}
          />
        ) : (
          <ListView tasks={finalFiltered} workspaceNames={workspaceNames} onTaskClick={setSelectedTaskId} />
        )}
      </div>

      {/* ── Unified Task Creation Modal ── */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTaskCreated={() => fetchData()}
      />

      {/* ── Task Detail Drawer ── */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}
