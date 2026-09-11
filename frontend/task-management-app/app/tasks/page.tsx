/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format, isToday, isTomorrow, isBefore, isAfter, addDays, startOfDay } from "date-fns";
import { CheckCircle2, Clock, AlertCircle, CalendarClock, FolderOpen, Flag, ChevronRight } from "lucide-react";
import api from "@/lib/api";

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
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-blue-50 text-blue-600",
  Normal: "bg-slate-50 text-slate-600",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-red-50 text-red-600",
};

const STATUS_COLORS: Record<string, string> = {
  "To Do": "bg-slate-100 text-slate-600",
  "In Progress": "bg-amber-50 text-amber-700",
  "In Review": "bg-purple-50 text-purple-700",
  "Done": "bg-emerald-50 text-emerald-700",
};

function TaskCard({ task, workspaceNames }: { task: Task; workspaceNames: Record<string, string> }) {
  const wsName = task.workspaceId ? workspaceNames[task.workspaceId] : null;
  const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), startOfDay(new Date())) && task.status !== "Done";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const isDueTomorrow = task.dueDate && isTomorrow(new Date(task.dueDate));

  return (
    <Link href={task.workspaceId ? `/workspaces/${task.workspaceId}?tab=list` : "#"}>
      <div className={`group bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer
        ${isOverdue ? "border-red-200 hover:border-red-300" : "border-slate-200 hover:border-indigo-200"}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
              ${task.status === "Done" ? "bg-emerald-500 border-emerald-500" : "border-slate-300 group-hover:border-indigo-400"}`}>
              {task.status === "Done" && <CheckCircle2 size={12} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold text-sm leading-snug ${task.status === "Done" ? "line-through text-slate-400" : "text-slate-800"}`}>
                {task.title}
              </h4>
              {wsName && (
                <div className="flex items-center gap-1 mt-1">
                  <FolderOpen size={11} className="text-slate-400" />
                  <span className="text-xs text-slate-400">{wsName}</span>
                </div>
              )}
            </div>
          </div>
          <ChevronRight size={15} className="text-slate-300 group-hover:text-indigo-400 shrink-0 mt-0.5 transition-colors" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] ?? "bg-slate-50 text-slate-600"}`}>
              {task.priority}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status] ?? ""}`}>
              {task.status}
            </span>
          </div>
          {task.dueDate && (
            <span className={`text-xs font-bold flex items-center gap-1
              ${isOverdue ? "text-red-500" : isDueToday ? "text-orange-500" : isDueTomorrow ? "text-amber-500" : "text-slate-400"}`}>
              <CalendarClock size={11} />
              {isOverdue ? "Quá hạn · " : isDueToday ? "Hôm nay · " : isDueTomorrow ? "Ngày mai · " : ""}
              {format(new Date(task.dueDate), "dd/MM")}
            </span>
          )}
        </div>

        {task.progress > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${task.progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function Section({ title, icon, tasks, color, workspaceNames, emptyMsg }: {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  color: string;
  workspaceNames: Record<string, string>;
  emptyMsg: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${color}`}>{icon}</div>
        <h2 className="font-black text-slate-800 text-base">{title}</h2>
        <span className="ml-1 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 px-2">{emptyMsg}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tasks.map(t => <TaskCard key={t.taskId} task={t} workspaceNames={workspaceNames} />)}
        </div>
      )}
    </div>
  );
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workspaceNames, setWorkspaceNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "High" | "Medium">("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Load all workspaces and their tasks
        const wsRes = await api.get("/Workspaces");
        const wsData = wsRes.data as { workspaceId: string; name: string }[];
        const namesMap: Record<string, string> = {};
        wsData.forEach(w => { namesMap[w.workspaceId] = w.name; });
        setWorkspaceNames(namesMap);

        // Load tasks from all workspaces
        const taskPromises = wsData.map(w =>
          api.get(`/Tasks?workspaceId=${w.workspaceId}&pageSize=200`)
            .then(r => (r.data.items || []).map((t: any) => ({ ...t, workspaceId: w.workspaceId, workspaceName: w.name })))
            .catch(() => [])
        );
        const allTaskArrays = await Promise.all(taskPromises);
        const allTasks = (allTaskArrays.flat() as Task[]);
        setTasks(allTasks);
      } catch (err) {
        console.error("Failed to load tasks", err);
      } finally {
        setLoading(false);
      }
    };
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

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Đang tải công việc...</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {/* Page header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-100 z-10">
        <div className="px-8 pt-6 pb-4">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900">My Tasks</h1>
              <p className="text-sm text-slate-500 mt-1">
                {totalPending} việc cần làm · {completed.length} hoàn thành
              </p>
            </div>
            {/* Filter */}
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              {(["all", "High", "Medium"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}>
                  {f === "all" ? "Tất cả" : f === "High" ? "🔴 Cao" : "⬆ Trung bình"}
                </button>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Quá hạn", value: overdue.length, color: "text-red-600", bg: "bg-red-50" },
              { label: "Hôm nay", value: dueToday.length, color: "text-orange-600", bg: "bg-orange-50" },
              { label: "7 ngày tới", value: upcoming.length, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Hoàn thành", value: completed.length, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 text-center`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <Section
          title="Quá hạn"
          icon={<AlertCircle size={15} className="text-red-500" />}
          tasks={overdue}
          color="bg-red-50"
          workspaceNames={workspaceNames}
          emptyMsg="🎉 Không có task nào bị quá hạn!"
        />
        <Section
          title="Hôm nay"
          icon={<CalendarClock size={15} className="text-orange-500" />}
          tasks={dueToday}
          color="bg-orange-50"
          workspaceNames={workspaceNames}
          emptyMsg="Không có task nào đến hạn hôm nay"
        />
        <Section
          title="7 ngày tới"
          icon={<Clock size={15} className="text-amber-500" />}
          tasks={upcoming}
          color="bg-amber-50"
          workspaceNames={workspaceNames}
          emptyMsg="Không có task sắp đến hạn"
        />
        <Section
          title="Chưa có hạn"
          icon={<Flag size={15} className="text-slate-400" />}
          tasks={noDueDate}
          color="bg-slate-100"
          workspaceNames={workspaceNames}
          emptyMsg="Tất cả task đều có ngày hạn"
        />
        <Section
          title="Đã hoàn thành"
          icon={<CheckCircle2 size={15} className="text-emerald-500" />}
          tasks={completed}
          color="bg-emerald-50"
          workspaceNames={workspaceNames}
          emptyMsg="Chưa có task nào hoàn thành"
        />
      </div>
    </div>
  );
}
