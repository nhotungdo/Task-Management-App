"use client";

import React, { useEffect, useState, useCallback } from "react";
import { 
   Clock, MessageSquare, Link2, Check,
   Trash2, Edit3, Send, Target, Tag, Repeat, List, X, Loader2
} from "lucide-react";
import api from "@/lib/api";
import SubtasksManager from "@/components/SubtasksManager";
import AttachmentsManager from "@/components/AttachmentsManager";
import { Avatar } from "@/components/Avatar";
import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, PRIORITY_ICONS } from "@/lib/constants";
import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaskTag {
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
  estimatedHours?: number;
  actualHours?: number;
  isMilestone: boolean;
  recurrencePattern?: string;
  recurrenceEndDate?: string;
  recurrenceInterval: number;
  createdAt: string;
  ownerId?: string;
  workspaceId?: string;
  description?: string;
  tags?: TaskTag[];
}



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

interface TaskDetail extends Task {
  dependencies: { taskDependencyId: string; predecessorTaskId: string; predecessorTitle: string; type: string; lagDays: number }[];
  comments: { taskCommentId: string; content: string; createdAt: string; userId: string; userName: string }[];
  timeLogs: { timeLogId: string; hours: number; logDate: string; comment?: string; userId: string; userName: string }[];
  attachments: { taskAttachmentId: string; fileName: string; fileUrl: string; contentType?: string; fileSizeBytes: number; uploadedAt: string }[];
  assignees: { taskAssignmentId: string; userId: string; userName: string; userEmail: string }[];
  subtasks: Subtask[];
}
// ─── Helpers ──────────────────────────────────────────────────────────────────

// Removed inline constants

// ─── Safe Date Helper ─────────────────────────────────────────────────────────

function safeFormatDate(dateStr?: string | null, formatStr: string = "yyyy-MM-dd"): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 1970) return "";
    return format(d, formatStr);
  } catch {
    return "";
  }
}


function TaskDetailDrawer({
  taskId,
  onClose,
  onRefresh,
}: {
  taskId: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "timelog">("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [newTimeLog, setNewTimeLog] = useState({ hours: "", date: safeFormatDate(new Date().toISOString(), "yyyy-MM-dd"), comment: "" });
  const [postingTimeLog, setPostingTimeLog] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await api.get(`/Tasks/${taskId}`);
      const data = res.data;
      if (!data) return;

      const normalizedDetail: TaskDetail = {
        ...data,
        dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
        comments: Array.isArray(data.comments) ? data.comments : [],
        timeLogs: Array.isArray(data.timeLogs) ? data.timeLogs : [],
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
        assignees: Array.isArray(data.assignees) ? data.assignees : [],
        subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
      };
      setDetail(normalizedDetail);
      setEditedTask({
        title: data.title || "",
        description: data.description || "",
        status: data.status || "To Do",
        priority: data.priority || "Normal",
        startDate: safeFormatDate(data.startDate, "yyyy-MM-dd") || undefined,
        dueDate: safeFormatDate(data.dueDate, "yyyy-MM-dd") || undefined,
        progress: typeof data.progress === "number" ? data.progress : 0,
        estimatedHours: data.estimatedHours,
        isMilestone: !!data.isMilestone,
      });
    } catch (err) {
      console.error("Failed to load task detail:", err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDetail();
  }, [loadDetail]);

  const handleSave = async () => {
    if (!detail) return;
    try {
      await api.put(`/Tasks/${taskId}`, {
        ...editedTask,
        startDate: editedTask.startDate?.trim() ? new Date(editedTask.startDate).toISOString() : null,
        dueDate: editedTask.dueDate?.trim() ? new Date(editedTask.dueDate).toISOString() : null,
      });
      setIsEditing(false);
      loadDetail();
      onRefresh();
    } catch (err) { console.error("Failed to save task:", err); }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      await api.post(`/Tasks/${taskId}/comments`, { content: newComment });
      setNewComment("");
      loadDetail();
    } catch { console.error("Failed to post comment"); }
    finally { setPostingComment(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/Tasks/${taskId}/comments/${commentId}`);
      loadDetail();
    } catch { console.error("Failed to delete comment"); }
  };

  const handleLogTime = async () => {
    if (!newTimeLog.hours || parseFloat(newTimeLog.hours) <= 0) return;
    setPostingTimeLog(true);
    try {
      await api.post(`/TimeLogs`, {
        taskId,
        hours: parseFloat(newTimeLog.hours),
        logDate: new Date(newTimeLog.date).toISOString(),
        comment: newTimeLog.comment || null,
      });
      setNewTimeLog({ hours: "", date: safeFormatDate(new Date().toISOString(), "yyyy-MM-dd"), comment: "" });
      loadDetail();
    } catch { console.error("Failed to log time"); }
    finally { setPostingTimeLog(false); }
  };

  const handleDeleteTask = async () => {
    if (!confirm(`Bạn có chắc muốn xóa task "${detail?.title}"?`)) return;
    setDeletingTask(true);
    try {
      await api.delete(`/Tasks/${taskId}`);
      onClose();
      onRefresh();
    } catch { console.error("Failed to delete task"); }
    finally { setDeletingTask(false); }
  };

  const totalLoggedHours = (detail?.timeLogs ?? []).reduce((sum, tl) => sum + (tl.hours || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="w-[560px] bg-white h-full flex flex-col shadow-2xl border-l border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
          </div>
        ) : detail ? (
          <>
            {/* Drawer Header */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    autoFocus
                    value={editedTask.title ?? ""}
                    onChange={e => setEditedTask(p => ({ ...p, title: e.target.value }))}
                    className="w-full text-xl font-black text-slate-900 border-b-2 border-indigo-500 outline-none pb-1 bg-transparent"
                  />
                ) : (
                  <h2 className="text-xl font-black text-slate-900 leading-tight truncate">{detail.title}</h2>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[detail.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {detail.status}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${PRIORITY_COLORS[detail.priority] ?? ""}`}>
                    {PRIORITY_ICONS[detail.priority]} {detail.priority}
                  </span>
                  {detail.isMilestone && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                      <Target size={10} /> Milestone
                    </span>
                  )}
                  {(detail.tags ?? []).map(tag => (
                    <span key={tag.tagId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: (tag.color || "#6B7280") + "15", color: tag.color }}>
                      <Tag size={10} /> {tag.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isEditing ? (
                  <>
                    <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700"><Check size={14}/> Lưu</button>
                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200">Hủy</button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200">
                    <Edit3 size={13}/> Sửa
                  </button>
                )}
                <button onClick={handleDeleteTask} disabled={deletingTask} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={16}/>
                </button>
                <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                  <X size={18}/>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-6">
              {(["details", "comments", "timelog"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                    activeTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab === "details" && <><List size={14}/> Chi tiết</>}
                  {tab === "comments" && <><MessageSquare size={14}/> Bình luận <span className="ml-1 text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">{(detail.comments ?? []).length}</span></>}
                  {tab === "timelog" && <><Clock size={14}/> Time Log <span className="ml-1 text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">{totalLoggedHours.toFixed(1)}h</span></>}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              
              {/* ── DETAILS TAB ── */}
              {activeTab === "details" && (
                <div className="p-6 space-y-6">
                  
                  {/* Status + Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Trạng thái</label>
                      {isEditing ? (
                        <select value={editedTask.status} onChange={e => setEditedTask(p => ({ ...p, status: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white">
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="In Review">In Review</option>
                          <option value="Done">Done</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold border ${STATUS_COLORS[detail.status]}`}>{detail.status}</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ưu tiên</label>
                      {isEditing ? (
                        <select value={editedTask.priority} onChange={e => setEditedTask(p => ({ ...p, priority: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white">
                          <option value="Low">Thấp</option>
                          <option value="Normal">Bình thường</option>
                          <option value="Medium">Trung bình</option>
                          <option value="High">Cao</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold ${PRIORITY_COLORS[detail.priority]}`}>
                          {PRIORITY_ICONS[detail.priority]} {detail.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ngày bắt đầu</label>
                      {isEditing ? (
                        <input type="date" value={editedTask.startDate ?? ""} onChange={e => setEditedTask(p => ({ ...p, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white" />
                      ) : (
                        <p className="text-sm font-bold text-slate-700">{safeFormatDate(detail.startDate, "dd/MM/yyyy") || <span className="text-slate-400 font-normal">Chưa đặt</span>}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Hạn chót</label>
                      {isEditing ? (
                        <input type="date" value={editedTask.dueDate ?? ""} onChange={e => setEditedTask(p => ({ ...p, dueDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white" />
                      ) : (
                        <p className="text-sm font-bold text-slate-700">{safeFormatDate(detail.dueDate, "dd/MM/yyyy") || <span className="text-slate-400 font-normal">Chưa đặt</span>}</p>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tiến độ</label>
                      <span className="text-sm font-black text-indigo-600">{isEditing ? editedTask.progress : detail.progress}%</span>
                    </div>
                    {isEditing ? (
                      <input type="range" min={0} max={100} step={5} value={editedTask.progress ?? 0}
                        onChange={e => setEditedTask(p => ({ ...p, progress: parseInt(e.target.value) }))}
                        className="w-full accent-indigo-600" />
                    ) : (
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all" style={{ width: `${detail.progress}%` }} />
                      </div>
                    )}
                  </div>

                  {/* Hours */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Ước tính (giờ)</label>
                      {isEditing ? (
                        <input type="number" step="0.5" min="0" value={editedTask.estimatedHours ?? ""}
                          onChange={e => setEditedTask(p => ({ ...p, estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white" placeholder="0" />
                      ) : (
                        <p className="text-sm font-bold text-slate-700">{detail.estimatedHours ? `${detail.estimatedHours}h` : <span className="text-slate-400 font-normal">—</span>}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Thực tế (giờ)</label>
                      <p className="text-sm font-bold text-slate-700">{totalLoggedHours > 0 ? `${totalLoggedHours.toFixed(1)}h` : <span className="text-slate-400 font-normal">0h</span>}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mô tả</label>
                    {isEditing ? (
                      <textarea rows={4} value={editedTask.description ?? ""}
                        onChange={e => setEditedTask(p => ({ ...p, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 resize-none"
                        placeholder="Nhập mô tả..." />
                    ) : (
                      <p className="text-sm text-slate-600 leading-relaxed">{detail.description || <span className="text-slate-400">Không có mô tả</span>}</p>
                    )}
                  </div>

                  {/* Assignees */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Người được giao</label>
                    <div className="flex flex-wrap gap-2">
                      {(detail.assignees ?? []).length > 0 ? (detail.assignees ?? []).map(a => (
                        <div key={a.taskAssignmentId} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
                          <Avatar name={a.userName} />
                          <span className="text-xs font-bold text-slate-700">{a.userName}</span>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-400">Chưa giao cho ai</p>
                      )}
                    </div>
                  </div>

                  {/* Dependencies */}
                  {(detail.dependencies ?? []).length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Phụ thuộc</label>
                      <div className="space-y-2">
                        {(detail.dependencies ?? []).map(d => (
                          <div key={d.taskDependencyId} className="flex items-center gap-2 text-sm">
                            <Link2 size={14} className="text-slate-400" />
                            <span className="font-bold text-indigo-600">{d.predecessorTitle}</span>
                            <span className="text-slate-400 text-xs">({d.type}{d.lagDays !== 0 ? ` +${d.lagDays}d` : ""})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                   {/* Milestone toggle */}
                   {isEditing && (
                     <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                       <input type="checkbox" id="milestone-toggle" checked={editedTask.isMilestone ?? false}
                         onChange={e => setEditedTask(p => ({ ...p, isMilestone: e.target.checked }))}
                         className="w-4 h-4 accent-purple-600" />
                       <label htmlFor="milestone-toggle" className="text-sm font-bold text-purple-700 cursor-pointer">Đánh dấu là Milestone ◆</label>
                     </div>
                   )}

                   {/* Recurrence */}
                   {detail.recurrencePattern && (
                     <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                       <Repeat size={14} className="text-indigo-600" />
                       <span className="text-sm font-bold text-indigo-700">
                         Lặp lại: {detail.recurrencePattern === "Daily" ? "Hàng ngày" : detail.recurrencePattern === "Weekly" ? "Hàng tuần" : detail.recurrencePattern === "Monthly" ? "Hàng tháng" : detail.recurrencePattern === "Yearly" ? "Hàng năm" : detail.recurrencePattern}
                       </span>
                       {detail.recurrenceEndDate && (
                         <span className="text-xs text-slate-500">· đến {safeFormatDate(detail.recurrenceEndDate, "dd/MM/yyyy")}</span>
                       )}
                     </div>
                   )}

                    {/* Subtasks */}
                    <SubtasksManager taskId={taskId} subtasks={(detail.subtasks ?? [])} onUpdate={loadDetail} workspaceId={detail.workspaceId} />

                    {/* Attachments */}
                    <AttachmentsManager taskId={taskId} attachments={(detail.attachments ?? [])} onUpdate={loadDetail} />
                  </div>
              )}

              {/* ── COMMENTS TAB ── */}
              {activeTab === "comments" && (
                <div className="p-6 flex flex-col gap-4">
                  {(detail.comments ?? []).length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(detail.comments ?? []).map(c => (
                        <div key={c.taskCommentId} className="flex gap-3 group">
                          <Avatar name={c.userName} size="md" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-slate-800">{c.userName}</span>
                              <span className="text-xs text-slate-400">{safeFormatDate(c.createdAt, "dd/MM HH:mm")}</span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl px-3 py-2">{c.content}</p>
                          </div>
                          <button onClick={() => handleDeleteComment(c.taskCommentId)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-400 transition-all self-start mt-1 rounded">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment input */}
                  <div className="flex gap-3 pt-2 border-t border-slate-100">
                    <textarea
                      rows={3}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePostComment(); }}
                      className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
                      placeholder="Viết bình luận... (Ctrl+Enter để gửi)"
                    />
                    <button onClick={handlePostComment} disabled={postingComment || !newComment.trim()}
                      className="self-end px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                      <Send size={14}/> Gửi
                    </button>
                  </div>
                </div>
              )}

              {/* ── TIME LOG TAB ── */}
              {activeTab === "timelog" && (
                <div className="p-6 space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
                      <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">Ước tính</p>
                      <p className="text-2xl font-black text-indigo-700">{detail.estimatedHours ?? 0}h</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-1">Thực tế</p>
                      <p className="text-2xl font-black text-emerald-700">{totalLoggedHours.toFixed(1)}h</p>
                    </div>
                  </div>

                  {/* Log form */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">Ghi nhận giờ làm việc</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Số giờ</label>
                        <input type="number" step="0.5" min="0.5" max="24" value={newTimeLog.hours}
                          onChange={e => setNewTimeLog(p => ({ ...p, hours: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                          placeholder="1.5" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Ngày</label>
                        <input type="date" value={newTimeLog.date}
                          onChange={e => setNewTimeLog(p => ({ ...p, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white" />
                      </div>
                    </div>
                    <input type="text" value={newTimeLog.comment}
                      onChange={e => setNewTimeLog(p => ({ ...p, comment: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white mb-3"
                      placeholder="Ghi chú (tùy chọn)" />
                    <button onClick={handleLogTime} disabled={postingTimeLog || !newTimeLog.hours}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                      {postingTimeLog ? "Đang lưu..." : "Ghi nhận"}
                    </button>
                  </div>

                  {/* Log list */}
                  {(detail.timeLogs ?? []).length > 0 ? (
                    <div className="space-y-2">
                      {(detail.timeLogs ?? []).map(tl => (
                        <div key={tl.timeLogId} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Avatar name={tl.userName} size="sm" />
                            <div>
                              <p className="text-sm font-bold text-slate-800">{tl.userName}</p>
                              {tl.comment && <p className="text-xs text-slate-500">{tl.comment}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-indigo-600">{tl.hours}h</p>
                            <p className="text-xs text-slate-400">{safeFormatDate(tl.logDate, "dd/MM/yyyy")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Clock size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Chưa có giờ làm việc được ghi nhận</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">Không tìm thấy task</div>
        )}
      </div>
    </div>
  );
}

export default TaskDetailDrawer;

