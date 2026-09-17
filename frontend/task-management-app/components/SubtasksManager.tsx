/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { CheckSquare, Square, Plus, Trash2, User, Calendar, GripVertical } from "lucide-react";
import api from "@/lib/api";

interface Subtask {
  subtaskId: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  assignedToUserId?: string;
  dueDate?: string;
  sortOrder: number;
  createdAt: string;
}

interface SubtasksManagerProps {
  taskId: string;
  subtasks: Subtask[];
  onUpdate: () => void;
  workspaceId?: string;
}

export default function SubtasksManager({ taskId, subtasks: initialSubtasks, onUpdate, workspaceId }: SubtasksManagerProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSubtasks);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/Tasks/${taskId}/subtasks`);
      setSubtasks(res.data || []);
      onUpdate();
    } catch {
      console.error("Failed to load subtasks");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    setSubtasks(initialSubtasks);
  }, [initialSubtasks]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setAdding(true);
    try {
      await api.post(`/Tasks/${taskId}/subtasks`, {
        title: newSubtaskTitle.trim(),
      });
      setNewSubtaskTitle("");
      await refresh();
    } catch {
      console.error("Failed to add subtask");
    } finally {
      setAdding(false);
    }
  };

  const toggleComplete = async (subtaskId: string) => {
    const subtask = subtasks.find(s => s.subtaskId === subtaskId);
    if (!subtask) return;
    try {
      await api.put(`/Tasks/${taskId}/subtasks/${subtaskId}`, { isCompleted: !subtask.isCompleted });
      await refresh();
    } catch {
      console.error("Failed to update subtask");
    }
  };

  const handleDelete = async (subtaskId: string) => {
    if (!confirm("Xóa công việc con này?")) return;
    try {
      await api.delete(`/Tasks/${taskId}/subtasks/${subtaskId}`);
      await refresh();
    } catch {
      console.error("Failed to delete subtask");
    }
  };

  const completedCount = subtasks.filter(s => s.isCompleted).length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
          <CheckSquare size={14} className="text-indigo-500" />
          Công việc con ({completedCount}/{totalCount})
        </label>
        {totalCount > 0 && (
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{progress}% hoàn thành</span>
        )}
      </div>

      {totalCount > 0 && (
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="space-y-2">
        {subtasks
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(subtask => (
            <div key={subtask.subtaskId} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all group">
              <button
                onClick={() => toggleComplete(subtask.subtaskId)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  subtask.isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white border-slate-300 group-hover:border-indigo-400"
                }`}
              >
                {subtask.isCompleted && <CheckSquare size={10} className="fill-current" />}
              </button>
              <span className={`flex-1 text-sm font-medium ${subtask.isCompleted ? "line-through text-slate-400" : "text-slate-700"}`}>
                {subtask.title}
              </span>
              {subtask.dueDate && (
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  <Calendar size={10} className="inline mr-0.5" />
                  {new Date(subtask.dueDate).toLocaleDateString("vi-VN")}
                </span>
              )}
              <button
                onClick={() => handleDelete(subtask.subtaskId)}
                className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={e => setNewSubtaskTitle(e.target.value)}
            placeholder="Thêm công việc con..."
            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            disabled={adding}
          />
          <button
            type="submit"
            disabled={adding || !newSubtaskTitle.trim()}
            className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            <Plus size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
