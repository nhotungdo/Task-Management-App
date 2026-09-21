"use client";

import React, { useMemo, useState } from "react";
import { Gantt, Task as GanttTask, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { addDays } from "date-fns";

interface Task {
  taskId: string;
  title: string;
  startDate?: string;
  dueDate?: string;
  progress?: number;
  status: string;
  dependencies?: { predecessorTaskId: string }[];
}

interface GanttViewProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export default function GanttView({ tasks, onTaskUpdate }: GanttViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);

  const ganttTasks: GanttTask[] = useMemo(() => {
    return tasks.map((t) => {
      const start = t.startDate ? new Date(t.startDate) : new Date();
      const end = t.dueDate ? new Date(t.dueDate) : addDays(start, 1);
      
      // Ensure start is before end
      if (start > end) {
        end.setTime(start.getTime() + 24 * 60 * 60 * 1000);
      }

      return {
        id: t.taskId,
        name: t.title,
        start,
        end,
        progress: t.progress || 0,
        type: "task",
        isDisabled: false,
        styles: {
          progressColor: t.status === "Done" ? "#10b981" : "#6366f1",
          progressSelectedColor: t.status === "Done" ? "#059669" : "#4f46e5",
        },
        dependencies: (t.dependencies || []).map(d => d.predecessorTaskId)
      };
    });
  }, [tasks]);

  const handleTaskChange = (task: GanttTask) => {
    onTaskUpdate(task.id, {
      startDate: task.start.toISOString(),
      dueDate: task.end.toISOString(),
      progress: task.progress
    });
  };

  const handleProgressChange = async (task: GanttTask) => {
    onTaskUpdate(task.id, {
      progress: task.progress
    });
  };

  const handleExpanderClick = (task: GanttTask) => {
    console.log("Expander clicked", task);
  };

  if (ganttTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-50 border border-dashed border-slate-200 rounded-xl m-4">
        <p className="text-sm font-medium text-slate-500">Chưa có công việc nào để hiển thị trên Gantt Chart</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden m-4">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-sm text-slate-700">Timeline & Gantt</h3>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === ViewMode.Day ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setViewMode(ViewMode.Day)}
          >
            Ngày
          </button>
          <button 
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === ViewMode.Week ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setViewMode(ViewMode.Week)}
          >
            Tuần
          </button>
          <button 
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === ViewMode.Month ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setViewMode(ViewMode.Month)}
          >
            Tháng
          </button>
        </div>
      </div>
      
      {/* Gantt Wrapper */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar" style={{ minHeight: "500px" }}>
        <Gantt
          tasks={ganttTasks}
          viewMode={viewMode}
          onDateChange={handleTaskChange}
          onProgressChange={handleProgressChange}
          onExpanderClick={handleExpanderClick}
          listCellWidth="155px"
          columnWidth={viewMode === ViewMode.Month ? 150 : 60}
          headerHeight={50}
          barCornerRadius={6}
          barFill={50}
          barProgressColor="#6366f1"
          barProgressSelectedColor="#4f46e5"
          barBackgroundColor="#e2e8f0"
          barBackgroundSelectedColor="#cbd5e1"
          projectProgressColor="#10b981"
          projectProgressSelectedColor="#059669"
          projectBackgroundColor="#e2e8f0"
          projectBackgroundSelectedColor="#cbd5e1"
          milestoneBackgroundColor="#f59e0b"
          milestoneBackgroundSelectedColor="#d97706"
        />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }
      `}} />
    </div>
  );
}
