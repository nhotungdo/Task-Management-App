"use client";

import React, { useState } from "react";
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CheckCircle2, FolderOpen, CalendarClock } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, PRIORITY_DOTS } from "@/lib/constants";
import { startOfDay, isBefore, isToday, isTomorrow, format } from "date-fns";

function safeDate(d?: string | null): string {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime()) || dt.getFullYear() < 1970) return "";
    return format(dt, "dd/MM");
  } catch { return ""; }
}

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

// ── Draggable Task Card ──
function DraggableTaskCard({ task, workspaceNames, onTaskClick, isDraggingOverlay = false }: { task: Task; workspaceNames: Record<string, string>; onTaskClick?: (id: string) => void; isDraggingOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.taskId,
    data: { task }
  });

  const wsName = task.workspaceId ? workspaceNames[task.workspaceId] : null;
  const today = startOfDay(new Date());
  const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), today) && task.status !== "Done";
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const isDueTomorrow = task.dueDate && isTomorrow(new Date(task.dueDate));

  const content = (
    <div
      className={`group bg-white rounded-2xl p-4 border transition-all duration-200
        ${isOverdue ? "border-red-200" : "border-slate-200"}
        ${isDraggingOverlay ? "shadow-2xl scale-105 rotate-2 cursor-grabbing opacity-90" : "hover:shadow-lg cursor-grab hover:-translate-y-1"}
        ${isDragging && !isDraggingOverlay ? "opacity-30" : "opacity-100"}
      `}
      onClick={() => { if (!isDragging && onTaskClick) onTaskClick(task.taskId); }}
    >
      <div className="flex items-start justify-between gap-3 mb-3" {...listeners} {...attributes}>
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200
            ${task.status === "Done" ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
            {task.status === "Done" && <CheckCircle2 size={11} className="text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold text-sm leading-snug transition-colors duration-200 ${
              task.status === "Done" ? "line-through text-slate-400" : "text-slate-800"
            }`}>{task.title}</h4>
            {wsName && (
              <div className="flex items-center gap-1 mt-1">
                <FolderOpen size={10} className="text-slate-400" />
                <span className="text-[11px] text-slate-400">{wsName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority] ?? "bg-slate-50 text-slate-500 border-slate-200"}`}>
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
            {safeDate(task.dueDate)}
          </span>
        )}
      </div>

      {task.progress > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div ref={setNodeRef} className="touch-none">
      {content}
    </div>
  );
}

// ── Droppable Column ──
function DroppableColumn({ id, label, color, dot, tasks, workspaceNames, onTaskClick }: { id: string; label: string; color: string; dot: string; tasks: Task[]; workspaceNames: Record<string, string>; onTaskClick: (id: string) => void }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={`flex-shrink-0 w-[300px] rounded-2xl ${color} p-3 flex flex-col max-h-[70vh] border transition-colors duration-200 ${isOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200/50'} backdrop-blur-sm shadow-sm`}>
      <div className="flex items-center justify-between mb-4 px-1.5 pt-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dot} shadow-sm`} />
          <h3 className="font-bold text-sm text-slate-800">{label}</h3>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full shadow-sm">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-2" style={{ scrollbarWidth: "thin", minHeight: "100px" }}>
        {tasks.map((t) => (
          <DraggableTaskCard key={t.taskId} task={t} workspaceNames={workspaceNames} onTaskClick={onTaskClick} />
        ))}
      </div>
    </div>
  );
}

// ── Main Board ──
export default function KanbanBoard({ tasksByStatus, workspaceNames, onTaskClick, onTaskMove }: { tasksByStatus: Record<string, Task[]>; workspaceNames: Record<string, string>; onTaskClick: (id: string) => void; onTaskMove: (taskId: string, newStatus: string) => void; }) {
  const columns = [
    { id: "To Do", label: "Cần làm", color: "bg-slate-100/70", dot: "bg-slate-400" },
    { id: "In Progress", label: "Đang làm", color: "bg-indigo-50/70", dot: "bg-indigo-500" },
    { id: "In Review", label: "Chờ duyệt", color: "bg-amber-50/70", dot: "bg-amber-500" },
    { id: "Done", label: "Hoàn thành", color: "bg-emerald-50/70", dot: "bg-emerald-500" }
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(event.active.data.current?.task as Task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;
    
    // Call the parent handler to update state and API
    onTaskMove(taskId, newStatus);
  };

  const totalTasks = Object.values(tasksByStatus).reduce((acc, tasks) => acc + tasks.length, 0);
  if (totalTasks === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
        <span className="text-4xl mb-3 animate-float inline-block">📭</span>
        <p className="text-base font-semibold text-slate-700">Không tìm thấy công việc nào</p>
        <p className="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-5 h-full overflow-x-auto pb-4 items-start animate-slide-up" style={{ scrollbarWidth: "thin" }}>
        {columns.map(col => (
          <DroppableColumn
            key={col.id}
            id={col.id}
            label={col.label}
            color={col.color}
            dot={col.dot}
            tasks={tasksByStatus[col.id] || []}
            workspaceNames={workspaceNames}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      
      <DragOverlay>
        {activeTask ? (
          <DraggableTaskCard task={activeTask} workspaceNames={workspaceNames} isDraggingOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
