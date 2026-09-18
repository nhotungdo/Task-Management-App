/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { isBefore, isToday, isTomorrow, isAfter, addDays, startOfDay, format } from "date-fns";
import { CheckCircle2, Clock, AlertCircle, CalendarClock, FolderOpen, ChevronDown, ChevronRight, Sparkles, Target, Plus, Tag } from "lucide-react";
import api from "@/lib/api";
import CreateTaskModal from "@/components/CreateTaskModal";

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

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-blue-50 text-blue-600 border-blue-100",
  Normal: "bg-slate-50 text-slate-500 border-slate-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  High: "bg-red-50 text-red-600 border-red-100",
};
const PRIORITY_LABELS: Record<string, string> = { Low: "Thấp", Normal: "Bình thường", Medium: "Trung bình", High: "Cao" };
const PRIORITY_DOTS: Record<string, string> = { Low: "bg-blue-400", Normal: "bg-slate-400", Medium: "bg-amber-400", High: "bg-red-500" };
const STATUS_COLORS: Record<string, string> = {
  "To Do": "bg-slate-100 text-slate-500",
  "In Progress": "bg-amber-50 text-amber-700",
  "In Review": "bg-purple-50 text-purple-700",
  "Done": "bg-emerald-50 text-emerald-700",
};
const STATUS_LABELS: Record<string, string> = {
  "To Do": "Cần làm", "In Progress": "Đang làm", "In Review": "Chờ duyệt", "Done": "Hoàn thành",
};

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
    <div className={`animate-stagger ${delay} group ${color} rounded-2xl p-4 text-center hover:scale-105 transition-all duration-200 cursor-default`}>
      <div className="flex items-center justify-center mb-2">{icon}</div>
      <p className="text-3xl font-black text-slate-900">{val}</p>
      <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
    </div>
  );
}

function TaskCard({ task, workspaceNames, cardIdx }: { task: Task; workspaceNames: Record<string, string>; cardIdx: number }) {
  const wsName = task.workspaceId ? workspaceNames[task.workspaceId] : null;
  const today = startOfDay(new Date());
  const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), today) && task.status !== "Done";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const isDueTomorrow = task.dueDate && isTomorrow(new Date(task.dueDate));
  const delays = ["delay-0", "delay-50", "delay-100", "delay-150", "delay-200", "delay-250", "delay-300", "delay-350", "delay-400"];
  const delayClass = delays[cardIdx % delays.length];

  return (
    <Link href={task.workspaceId ? `/workspaces/${task.workspaceId}?tab=list` : "#"}>
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
    </Link>
  );
}

function Section({ title, icon, tasks, colorClass, workspaceNames, emptyMsg, emptyIcon, isOverdueSection = false }: {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  colorClass: string;
  workspaceNames: Record<string, string>;
  emptyMsg: string;
  emptyIcon: string;
  isOverdueSection?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`mb-8 animate-slide-up ${isOverdueSection && tasks.length > 0 ? "animate-danger-glow rounded-2xl" : ""}`}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2.5 mb-4 w-full text-left group"
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass} transition-transform group-hover:scale-110`}>{icon}</div>
        <h2 className="font-black text-slate-800 text-base">{title}</h2>
        <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full transition-all animate-pop-in ${
          isOverdueSection && tasks.length > 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
        } ${isOverdueSection && tasks.length > 0 ? "animate-bounce" : ""}`}>{tasks.length}</span>
        <div className="flex-1" />
        <span className="text-slate-300 group-hover:text-slate-500 transition-colors">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {!collapsed && (
        tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 animate-slide-up">
            <span className="text-3xl mb-2 animate-float inline-block">{emptyIcon}</span>
            <p className="text-sm font-medium">{emptyMsg}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tasks.map((t, i) => <TaskCard key={t.taskId} task={t} workspaceNames={workspaceNames} cardIdx={i} />)}
          </div>
        )
      )}
    </div>
  );
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspaceNames, setWorkspaceNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "High" | "Medium">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "High" | "Medium">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const overdue = filtered.filter(t => t.dueDate && isBefore(new Date(t.dueDate), today) && t.status !== "Done");
  const dueToday = filtered.filter(t => t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "Done");
  const upcoming = filtered.filter(t => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    return isAfter(due, today) && isBefore(due, inSevenDays) && !isToday(due) && t.status !== "Done";
  });
  const noDueDate = filtered.filter(t => !t.dueDate && t.status !== "Done");
  const completed = filtered.filter(t => t.status === "Done");
  const totalPending = overdue.length + dueToday.length + upcoming.length + noDueDate.length;

  const handleFilter = (f: "all" | "High" | "Medium") => {
    setActiveFilter(f);
    setFilter(f);
  };

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
              <h1 className="text-3xl font-black text-slate-900">Công việc của tôi</h1>
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-bold text-slate-700">{totalPending}</span> việc cần làm ·
                <span className="font-bold text-emerald-600 ml-1">{completed.length}</span> hoàn thành
              </p>
            </div>

            <div className="flex items-center gap-3 animate-slide-up delay-100">
              {/* Filter pills */}
              <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                {(["all", "High", "Medium"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => handleFilter(f)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      activeFilter === f ? "bg-white shadow-sm text-indigo-600 scale-105" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                    }`}
                  >
                    {f === "all" ? "Tất cả" : f === "High" ? "🔴 Ưu tiên cao" : "⬆ Trung bình"}
                  </button>
                ))}
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
      <div className="px-8 py-6">
        <Section
          title="Quá hạn"
          icon={<AlertCircle size={16} className="text-red-500" />}
          tasks={overdue} colorClass="bg-red-50"
          workspaceNames={workspaceNames}
          emptyMsg="Tuyệt vời! Không có task nào bị quá hạn"
          emptyIcon="🎉"
          isOverdueSection
        />
        <Section
          title="Hôm nay"
          icon={<CalendarClock size={16} className="text-orange-500" />}
          tasks={dueToday} colorClass="bg-orange-50"
          workspaceNames={workspaceNames}
          emptyMsg="Không có task nào đến hạn hôm nay"
          emptyIcon="☀️"
        />
        <Section
          title="7 ngày tới"
          icon={<Clock size={16} className="text-amber-500" />}
          tasks={upcoming} colorClass="bg-amber-50"
          workspaceNames={workspaceNames}
          emptyMsg="Không có task sắp đến hạn trong 7 ngày"
          emptyIcon="📅"
        />
        <Section
          title="Chưa có hạn"
          icon={<Target size={16} className="text-slate-400" />}
          tasks={noDueDate} colorClass="bg-slate-100"
          workspaceNames={workspaceNames}
          emptyMsg="Tất cả task đều đã được đặt ngày hạn"
          emptyIcon="✅"
        />
        <Section
          title="Đã hoàn thành"
          icon={<CheckCircle2 size={16} className="text-emerald-500" />}
          tasks={completed} colorClass="bg-emerald-50"
          workspaceNames={workspaceNames}
          emptyMsg="Chưa có task nào hoàn thành"
          emptyIcon="🏁"
        />
      </div>

      {/* ── Unified Task Creation Modal ── */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTaskCreated={() => fetchData()}
      />
    </div>
  );
}
