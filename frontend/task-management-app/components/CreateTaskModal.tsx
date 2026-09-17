/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Calendar, Clock, Flag, FolderKanban, Sparkles, Target, AlertCircle, CheckCircle2, Tag, Repeat, Bell } from "lucide-react";
import api from "@/lib/api";

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (task?: any) => void;
  defaultWorkspaceId?: string;
  defaultStatus?: string;
  defaultPriority?: string;
  defaultDueDate?: string;
  defaultStartDate?: string;
  lockWorkspace?: boolean;
}

interface WorkspaceOption {
  workspaceId: string;
  name: string;
}

interface TagOption {
  tagId: string;
  name: string;
  color: string;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
  defaultWorkspaceId,
  defaultStatus = "To Do",
  defaultPriority = "Normal",
  defaultDueDate = "",
  defaultStartDate = "",
  lockWorkspace = false,
}: CreateTaskModalProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string>(defaultWorkspaceId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState(defaultPriority);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [estimatedHours, setEstimatedHours] = useState<string>("");
  const [isMilestone, setIsMilestone] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [recurrencePattern, setRecurrencePattern] = useState<string>("");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

   // Load workspaces if not locked or if workspaceId not set
  useEffect(() => {
    if (!isOpen) return;
    api.get("/Workspaces")
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setWorkspaces(list);
        if (!workspaceId && list.length > 0) {
          setWorkspaceId(defaultWorkspaceId || list[0].workspaceId);
        }
      })
      .catch(err => {
        console.error("Failed to load workspaces for task modal:", err);
      });
  }, [isOpen, defaultWorkspaceId, workspaceId]);

  // Load tags for the selected workspace
  useEffect(() => {
    if (!workspaceId) { setAvailableTags([]); return; }
    api.get(`/workspaces/${workspaceId}/tags`)
      .then(res => setAvailableTags(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAvailableTags([]));
  }, [workspaceId]);

  // Reset selected tags when workspace changes
  useEffect(() => {
    setSelectedTagIds(new Set());
  }, [workspaceId]);

  // Sync defaults when modal opens or defaults change
  useEffect(() => {
    if (isOpen) {
      if (defaultWorkspaceId) setWorkspaceId(defaultWorkspaceId);
      if (defaultStatus) setStatus(defaultStatus);
      if (defaultPriority) setPriority(defaultPriority);
      if (defaultDueDate) setDueDate(defaultDueDate);
      if (defaultStartDate) setStartDate(defaultStartDate);
      setErrorMessage("");
    }
  }, [isOpen, defaultWorkspaceId, defaultStatus, defaultPriority, defaultDueDate, defaultStartDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Vui lòng nhập tiêu đề công việc.");
      return;
    }
    const targetWs = workspaceId || defaultWorkspaceId;
    if (!targetWs) {
      setErrorMessage("Vui lòng chọn không gian làm việc (dự án).");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
       const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        workspaceId: targetWs,
        status,
        priority,
        progress: status === "Done" ? 100 : 0,
        isMilestone,
        reminderEnabled,
        recurrencePattern: recurrencePattern || null,
        recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
        recurrenceInterval: 1,
        tagIds: Array.from(selectedTagIds),
        startDate: startDate ? new Date(startDate).toISOString() : null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        estimatedHours: estimatedHours && parseFloat(estimatedHours) > 0 ? parseFloat(estimatedHours) : null,
      };

      const res = await api.post("/Tasks", payload);

      // Reset form
      setTitle("");
      setDescription("");
      setStatus(defaultStatus || "To Do");
      setPriority(defaultPriority || "Normal");
      setStartDate("");
      setDueDate("");
      setEstimatedHours("");
      setIsMilestone(false);
      setReminderEnabled(true);
      setRecurrencePattern("");
      setRecurrenceEndDate("");
      setSelectedTagIds(new Set());

      onTaskCreated?.(res.data);
      onClose();
    } catch (err: any) {
      console.error("Failed to create task:", err);
      const msg = err.response?.data?.message || err.response?.data?.title || "Không thể tạo công việc. Vui lòng thử lại.";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 z-10 animate-bounce-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <Plus size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Thêm công việc mới</h3>
              <p className="text-xs text-slate-400 font-medium">Tạo và phân bổ nhiệm vụ vào dự án</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-pop-in">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          
          {/* Workspace selector (if not locked) */}
          {!lockWorkspace && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FolderKanban size={13} className="text-indigo-500" />
                Dự án / Không gian làm việc <span className="text-red-500">*</span>
              </label>
              <select
                value={workspaceId}
                onChange={e => setWorkspaceId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                required
              >
                {workspaces.map(w => (
                  <option key={w.workspaceId} value={w.workspaceId}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Tiêu đề nhiệm vụ <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ví dụ: Thiết kế trang thanh toán, Phân tích API..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Mô tả chi tiết
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Nhập nội dung, checklist hoặc ghi chú cho công việc..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-indigo-500" />
                Trạng thái
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              >
                <option value="To Do">Cần làm</option>
                <option value="In Progress">Đang làm</option>
                <option value="In Review">Chờ duyệt</option>
                <option value="Done">Hoàn thành</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Flag size={13} className="text-indigo-500" />
                Độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              >
                <option value="Low">Thấp</option>
                <option value="Normal">Bình thường</option>
                <option value="Medium">Trung bình</option>
                <option value="High">Cao</option>
              </select>
            </div>
          </div>

          {/* Dates: StartDate & DueDate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-rose-500" />
                Hạn chót
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Estimated hours & Milestone */}
          <div className="grid grid-cols-2 gap-3 items-center pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock size={13} className="text-slate-400" />
                Ước tính (giờ)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="999"
                placeholder="Ví dụ: 4"
                value={estimatedHours}
                onChange={e => setEstimatedHours(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 hover:bg-purple-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 transition-colors">
                <input
                  type="checkbox"
                  checked={isMilestone}
                  onChange={e => setIsMilestone(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded"
                />
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Target size={13} className="text-purple-600" />
                  Cột mốc (Milestone)
                </span>
              </label>
            </div>
          </div>

          {/* Tags & Recurrence */}
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag size={13} className="text-pink-500" />
                Nhãn (Tags)
              </label>
              {availableTags.length === 0 ? (
                <p className="text-xs text-slate-400">Chưa có nhãn nào trong dự án này.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => {
                    const isSelected = selectedTagIds.has(tag.tagId);
                    return (
                      <button
                        key={tag.tagId}
                        type="button"
                        onClick={() => {
                          const newSet = new Set(selectedTagIds);
                          if (isSelected) newSet.delete(tag.tagId);
                          else newSet.add(tag.tagId);
                          setSelectedTagIds(newSet);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected ? "ring-2 ring-offset-1 ring-indigo-500" : "hover:bg-slate-100"
                        }`}
                        style={{ backgroundColor: isSelected ? tag.color + "20" : tag.color + "10", color: tag.color }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                        {isSelected && <span className="ml-1">×</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Repeat size={13} className="text-indigo-500" />
                Lặp lại (Recurrence)
              </label>
              <select
                value={recurrencePattern}
                onChange={e => setRecurrencePattern(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              >
                <option value="">Không lặp lại</option>
                <option value="Daily">Hằng ngày</option>
                <option value="Weekly">Hằng tuần</option>
                <option value="Monthly">Hàng tháng</option>
                <option value="Yearly">Hàng năm</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 transition-colors">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={e => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Bell size={13} className="text-indigo-600" />
                Bật nhắc nhở qua email
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-lg disabled:opacity-50 transition-all hover:-translate-y-0.5"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Tạo nhiệm vụ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
