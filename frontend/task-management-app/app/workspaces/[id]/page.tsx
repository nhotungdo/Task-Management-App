"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  BarChart3, LayoutGrid, Calendar as CalendarIcon, 
  List, GitCommit, MoreVertical, Plus,
  X, Users, AlertTriangle, ShieldAlert, Loader2, ChevronLeft, ChevronRight,
  Clock, MessageSquare, Paperclip, Link2, ChevronDown, Check,
  Flag, PlayCircle, Trash2, Edit3, Send, Target
} from "lucide-react";
import api from "@/lib/api";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval,
  differenceInDays, addDays, startOfDay, isAfter, isBefore
} from "date-fns";
import { vi } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  createdAt: string;
  ownerId?: string;
  description?: string;
}

interface TaskDetail extends Task {
  dependencies: { taskDependencyId: string; predecessorTaskId: string; predecessorTitle: string; type: string; lagDays: number }[];
  comments: { taskCommentId: string; content: string; createdAt: string; userId: string; userName: string }[];
  timeLogs: { timeLogId: string; hours: number; logDate: string; comment?: string; userId: string; userName: string }[];
  attachments: { taskAttachmentId: string; fileName: string; fileUrl: string; contentType?: string; fileSizeBytes: number; uploadedAt: string }[];
  assignees: { taskAssignmentId: string; userId: string; userName: string; userEmail: string }[];
}

interface Workspace {
  workspaceId: string;
  name: string;
  description?: string;
}

interface WorkspaceMember {
  userId: string;
  email: string;
  fullName?: string;
  role: string;
  joinedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  "To Do": "bg-slate-100 text-slate-600 border-slate-200",
  "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
  "In Review": "bg-purple-50 text-purple-700 border-purple-200",
  "Done": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-blue-50 text-blue-600",
  Normal: "bg-slate-50 text-slate-600",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-red-50 text-red-600",
};

const PRIORITY_ICONS: Record<string, string> = {
  Low: "▼", Normal: "●", Medium: "▲", High: "🔴",
};

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const colors = ["bg-indigo-100 text-indigo-700", "bg-fuchsia-100 text-fuchsia-700", "bg-emerald-100 text-emerald-700", "bg-orange-100 text-orange-700"];
  const idx = name.charCodeAt(0) % colors.length;
  const sizeClass = size === "lg" ? "w-10 h-10 text-sm" : size === "md" ? "w-8 h-8 text-xs" : "w-6 h-6 text-xs";
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold ${colors[idx]}`} title={name}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Task Detail Drawer ───────────────────────────────────────────────────────

function TaskDetailDrawer({
  taskId,
  tasks,
  members,
  onClose,
  onRefresh,
}: {
  taskId: string;
  tasks: Task[];
  members: WorkspaceMember[];
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
  const [newTimeLog, setNewTimeLog] = useState({ hours: "", date: format(new Date(), "yyyy-MM-dd"), comment: "" });
  const [postingTimeLog, setPostingTimeLog] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/Tasks/${taskId}`);
      setDetail(res.data);
      setEditedTask({
        title: res.data.title,
        description: res.data.description,
        status: res.data.status,
        priority: res.data.priority,
        startDate: res.data.startDate ? format(new Date(res.data.startDate), "yyyy-MM-dd") : undefined,
        dueDate: res.data.dueDate ? format(new Date(res.data.dueDate), "yyyy-MM-dd") : undefined,
        progress: res.data.progress,
        estimatedHours: res.data.estimatedHours,
        isMilestone: res.data.isMilestone,
      });
    } catch {
      console.error("Failed to load task detail");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const handleSave = async () => {
    if (!detail) return;
    try {
      await api.put(`/Tasks/${taskId}`, {
        ...editedTask,
        startDate: editedTask.startDate ? new Date(editedTask.startDate).toISOString() : null,
        dueDate: editedTask.dueDate ? new Date(editedTask.dueDate).toISOString() : null,
      });
      setIsEditing(false);
      loadDetail();
      onRefresh();
    } catch { console.error("Failed to save task"); }
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
      setNewTimeLog({ hours: "", date: format(new Date(), "yyyy-MM-dd"), comment: "" });
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

  const totalLoggedHours = detail?.timeLogs.reduce((sum, tl) => sum + tl.hours, 0) ?? 0;

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
                  {tab === "comments" && <><MessageSquare size={14}/> Bình luận <span className="ml-1 text-xs bg-slate-100 px-1.5 py-0.5 rounded-full">{detail.comments.length}</span></>}
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
                        <p className="text-sm font-bold text-slate-700">{detail.startDate ? format(new Date(detail.startDate), "dd/MM/yyyy") : <span className="text-slate-400 font-normal">Chưa đặt</span>}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Hạn chót</label>
                      {isEditing ? (
                        <input type="date" value={editedTask.dueDate ?? ""} onChange={e => setEditedTask(p => ({ ...p, dueDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white" />
                      ) : (
                        <p className="text-sm font-bold text-slate-700">{detail.dueDate ? format(new Date(detail.dueDate), "dd/MM/yyyy") : <span className="text-slate-400 font-normal">Chưa đặt</span>}</p>
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
                      {detail.assignees.length > 0 ? detail.assignees.map(a => (
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
                  {detail.dependencies.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Phụ thuộc</label>
                      <div className="space-y-2">
                        {detail.dependencies.map(d => (
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
                </div>
              )}

              {/* ── COMMENTS TAB ── */}
              {activeTab === "comments" && (
                <div className="p-6 flex flex-col gap-4">
                  {detail.comments.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {detail.comments.map(c => (
                        <div key={c.taskCommentId} className="flex gap-3 group">
                          <Avatar name={c.userName} size="md" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-slate-800">{c.userName}</span>
                              <span className="text-xs text-slate-400">{format(new Date(c.createdAt), "dd/MM HH:mm")}</span>
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
                  {detail.timeLogs.length > 0 ? (
                    <div className="space-y-2">
                      {detail.timeLogs.map(tl => (
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
                            <p className="text-xs text-slate-400">{format(new Date(tl.logDate), "dd/MM/yyyy")}</p>
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

// ─── Main Workspace Page ───────────────────────────────────────────────────────

export default function WorkspaceDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params.id as string;
  
  const defaultTab = searchParams.get("tab") || "board";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  // Task Detail Drawer
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Invite State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState({ text: "", type: "" });

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Task Creation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", status: "To Do", priority: "Medium", startDate: "", dueDate: "", estimatedHours: "" });

  // AI Risk State
  const [isAiRiskModalOpen, setIsAiRiskModalOpen] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [riskReport, setRiskReport] = useState<{ highRisk: number; mediumRisk: number; safe: number } | null>(null);

  // Gantt zoom
  const [ganttZoom, setGanttZoom] = useState<"month" | "week">("month");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tab !== activeTab) setActiveTab(tab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/workspaces/${workspaceId}?tab=${tab}`);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let usersData;
      try { usersData = (await api.get("/Users")).data; } catch { /* ignore */ }

      const uMap: Record<string, string> = {};
      if (usersData) {
        usersData.forEach((u: { userId: string; fullName?: string; email: string }) => { uMap[u.userId] = u.fullName || u.email; });
      }
      setUsersMap(uMap);

      const [wsRes, taskRes, membersRes] = await Promise.all([
        api.get(`/Workspaces/${workspaceId}`),
        api.get(`/Tasks?workspaceId=${workspaceId}&pageSize=200`),
        api.get(`/Workspaces/${workspaceId}/members`).catch(() => ({ data: [] })),
      ]);
      setWorkspace(wsRes.data);
      setTasks(taskRes.data.items || []);
      setMembers(membersRes.data || []);
    } catch {
      console.error("Failed to load workspace data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // ── Drag & Drop (Board) ──
  const handleDragStart = (e: React.DragEvent, taskId: string) => { e.dataTransfer.setData("taskId", taskId); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;
    const taskToUpdate = tasks.find(t => t.taskId === taskId);
    if (!taskToUpdate || taskToUpdate.status === newStatus) return;
    setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, status: newStatus } : t));
    try { await api.put(`/Tasks/${taskId}`, { ...taskToUpdate, status: newStatus }); }
    catch { loadData(); }
  };

  // ── Task Creation ──
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await api.post("/Tasks", {
        title: newTask.title,
        description: newTask.description || null,
        workspaceId,
        status: newTask.status,
        priority: newTask.priority,
        startDate: newTask.startDate ? new Date(newTask.startDate).toISOString() : null,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
        estimatedHours: newTask.estimatedHours ? parseFloat(newTask.estimatedHours) : null,
        progress: 0,
      });
      setIsModalOpen(false);
      setNewTask({ title: "", description: "", status: "To Do", priority: "Medium", startDate: "", dueDate: "", estimatedHours: "" });
      loadData();
    } catch { console.error("Failed to create task"); }
  };

  const handleAiAnalyze = () => {
    setIsAiRiskModalOpen(true);
    setIsAiAnalyzing(true);
    setRiskReport(null);
    setTimeout(() => {
      const today = new Date();
      let highRisk = 0, mediumRisk = 0, safe = 0;
      tasks.forEach(t => {
        if (t.status === "Done") { safe++; return; }
        const isOverdue = t.dueDate && isBefore(new Date(t.dueDate), today);
        if (isOverdue && t.priority === "High") { highRisk++; }
        else if (isOverdue || (t.priority === "High" && t.status === "To Do")) { mediumRisk++; }
        else { safe++; }
      });
      setRiskReport({ highRisk, mediumRisk, safe });
      setIsAiAnalyzing(false);
    }, 2000);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteMessage({ text: "", type: "" });
    try {
      await api.post(`/Workspaces/${workspaceId}/invite-by-email`, { email: inviteEmail });
      setInviteMessage({ text: "Đã mời thành viên thành công!", type: "success" });
      setInviteEmail("");
      loadData();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setInviteMessage({ text: error.response?.data?.message || "Có lỗi xảy ra.", type: "error" });
    } finally { setIsInviting(false); }
  };

  // ── Gantt Calculations ──
  const today = new Date();
  const ganttMonthYear = { year: today.getFullYear(), month: today.getMonth() };
  const daysInMonth = new Date(ganttMonthYear.year, ganttMonthYear.month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const COL_W = 36; // pixels per day

  // ── Workload Calculation ──
  const workloadMap: Record<string, { name: string; count: number; highPriority: number; done: number }> = {};
  tasks.forEach(t => {
    const owner = t.ownerId || "unassigned";
    if (!workloadMap[owner]) workloadMap[owner] = { name: owner === "unassigned" ? "Chưa phân công" : (usersMap[owner] || "Người dùng ẩn"), count: 0, highPriority: 0, done: 0 };
    workloadMap[owner].count += 1;
    if (t.priority === "High") workloadMap[owner].highPriority += 1;
    if (t.status === "Done") workloadMap[owner].done += 1;
  });
  const workloadArray = Object.values(workloadMap).sort((a, b) => b.count - a.count);

  if (loading) return <div className="p-8 text-slate-500">Đang tải dữ liệu dự án...</div>;
  if (!workspace) return <div className="p-8 text-red-500">Không tìm thấy dự án</div>;

  const tabs = [
    { id: "overview", label: "Tổng quan", icon: BarChart3 },
    { id: "board", label: "Bảng (Kanban)", icon: LayoutGrid },
    { id: "gantt", label: "Gantt Chart", icon: GitCommit },
    { id: "list", label: "Danh sách", icon: List },
    { id: "calendar", label: "Lịch", icon: CalendarIcon },
    { id: "workload", label: "Workload", icon: Users },
  ];

  // ── Completion stats for dashboard ──
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === "Done").length;
  const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
  const overdueTasks = tasks.filter(t => t.dueDate && isBefore(new Date(t.dueDate), today) && t.status !== "Done").length;
  const avgProgress = totalTasks > 0 ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / totalTasks) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--content-bg)", position: "relative" }}>
      
      {/* Task Detail Drawer */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          tasks={tasks}
          members={members}
          onClose={() => setSelectedTaskId(null)}
          onRefresh={loadData}
        />
      )}

      {/* ── GanttPRO-style Header ── */}
      <header style={{ background: "#fff", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {/* Project name bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", height: 52, borderBottom: "1px solid var(--border-light)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #0052cc, #0073e6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{workspace.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{workspace.name}</h2>
              {workspace.description && <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>{workspace.description}</p>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Members avatars */}
            <div style={{ display: "flex" }}>
              {members.slice(0, 4).map((m, i) => {
                const colors = ["#0052cc","#7c3aed","#059669","#d97706"];
                return (
                  <div key={m.userId}
                    style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid #fff", background: colors[i % 4], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", marginLeft: i === 0 ? 0 : -6, zIndex: 4 - i }}
                    title={m.fullName || m.email}>
                    {(m.fullName || m.email).charAt(0).toUpperCase()}
                  </div>
                );
              })}
              {members.length > 4 && (
                <div style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid #fff", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", marginLeft: -6 }}>+{members.length - 4}</div>
              )}
            </div>
            <button onClick={handleAiAnalyze} className="btn-secondary"
              style={{ background: "#fff8f0", borderColor: "#fed7aa", color: "#c2410c", fontSize: 12 }}>
              <ShieldAlert size={13} /> Phân tích rủi ro AI
            </button>
            <button onClick={() => setIsInviteModalOpen(true)} className="btn-secondary" style={{ fontSize: 12 }}>
              Chia sẻ
            </button>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ fontSize: 12 }}>
              <Plus size={13} /> Thêm task
            </button>
          </div>
        </div>

        {/* ── GanttPRO Tab Bar ── */}
        <div style={{ display: "flex", padding: "0 20px", overflowX: "auto" }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={`gp-tab ${isActive ? "active" : ""}`}>
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Content Area ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20, background: "var(--content-bg)" }}>

        {/* ── OVERVIEW (Dashboard) ── */}
        {activeTab === "overview" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Tổng task", value: totalTasks, color: "text-slate-800", bg: "bg-white", icon: "📋" },
                { label: "Hoàn thành", value: doneTasks, color: "text-emerald-600", bg: "bg-emerald-50", icon: "✅" },
                { label: "Đang làm", value: inProgressTasks, color: "text-amber-600", bg: "bg-amber-50", icon: "🔄" },
                { label: "Quá hạn", value: overdueTasks, color: "text-red-600", bg: "bg-red-50", icon: "⚠️" },
              ].map(kpi => (
                <div key={kpi.label} className={`${kpi.bg} border border-slate-200 rounded-2xl p-5 shadow-sm`}>
                  <p className="text-2xl mb-1">{kpi.icon}</p>
                  <p className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-800">Tiến độ dự án</h3>
                <span className="text-2xl font-black text-indigo-600">{avgProgress}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700"
                  style={{ width: `${avgProgress}%` }} />
              </div>
              <p className="text-xs text-slate-400">{doneTasks} / {totalTasks} công việc hoàn thành</p>
            </div>

            {/* Members workload */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Phân bổ công việc</h3>
              <div className="space-y-4">
                {workloadArray.map(w => (
                  <div key={w.name}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <Avatar name={w.name} />
                        <span className="text-sm font-bold text-slate-700">{w.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{w.count} task • {w.done} xong</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${w.count > 5 ? "bg-red-400" : "bg-indigo-400"}`}
                        style={{ width: `${Math.min((w.count / Math.max(...workloadArray.map(x => x.count), 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent tasks */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Task sắp đến hạn</h3>
              <div className="space-y-3">
                {tasks
                  .filter(t => t.dueDate && t.status !== "Done")
                  .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                  .slice(0, 5)
                  .map(t => (
                    <div key={t.taskId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setSelectedTaskId(t.taskId)}>
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${t.status === "In Progress" ? "bg-amber-400" : "bg-slate-300"}`} />
                        <span className="text-sm font-bold text-slate-700">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                        <span className="text-xs text-slate-500">{t.dueDate ? format(new Date(t.dueDate), "dd/MM/yyyy") : ""}</span>
                      </div>
                    </div>
                  ))}
                {tasks.filter(t => t.dueDate && t.status !== "Done").length === 0 && (
                  <p className="text-center text-slate-400 py-4">🎉 Không có task nào sắp đến hạn</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── GANTT CHART ── */}
        {activeTab === "gantt" && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div className="flex gap-3 items-center">
                <button onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                  <Plus size={14}/> Thêm task
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <span>Tháng {ganttMonthYear.month + 1}/{ganttMonthYear.year}</span>
                <div className="flex bg-slate-100 rounded-lg p-0.5">
                  {(["month", "week"] as const).map(z => (
                    <button key={z} onClick={() => setGanttZoom(z)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${ganttZoom === z ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}>
                      {z === "month" ? "Tháng" : "Tuần"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-1 overflow-auto">
              {/* Left: Task table */}
              <div className="w-[420px] border-r border-slate-200 shrink-0 sticky left-0 bg-white z-10 shadow-[2px_0_8px_rgba(0,0,0,0.04)] flex flex-col">
                {/* Header */}
                <div className="h-12 border-b border-slate-200 bg-slate-50 flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                  <div className="w-10 text-center border-r border-slate-200 h-full flex items-center justify-center">#</div>
                  <div className="flex-1 px-4 border-r border-slate-200 h-full flex items-center">Tên nhiệm vụ</div>
                  <div className="w-20 text-center border-r border-slate-200 h-full flex items-center justify-center">Tiến độ</div>
                  <div className="w-24 text-center h-full flex items-center justify-center">Trạng thái</div>
                </div>

                {tasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Chưa có nhiệm vụ nào</div>
                ) : (
                  tasks.map((t, idx) => (
                    <div key={t.taskId} onClick={() => setSelectedTaskId(t.taskId)}
                      className="h-12 border-b border-slate-100 flex items-center hover:bg-indigo-50 transition-colors cursor-pointer group">
                      <div className="w-10 text-center text-xs font-bold text-slate-400 border-r border-slate-100 h-full flex items-center justify-center">{idx + 1}</div>
                      <div className="flex-1 px-4 border-r border-slate-100 h-full flex items-center gap-2">
                        {t.isMilestone && <span className="text-purple-500 shrink-0">◆</span>}
                        <span className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-600" title={t.title}>{t.title}</span>
                      </div>
                      <div className="w-20 border-r border-slate-100 h-full flex items-center justify-center px-2">
                        <div className="w-full">
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${t.progress}%` }} />
                          </div>
                          <p className="text-center text-[10px] text-slate-400 mt-0.5">{t.progress}%</p>
                        </div>
                      </div>
                      <div className="w-24 h-full flex items-center justify-center px-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] ?? "bg-slate-100 text-slate-600"}`}>{t.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right: Timeline */}
              <div className="flex-1 relative" style={{ minWidth: `${daysInMonth * COL_W}px` }}>
                {/* Day headers */}
                <div className="h-12 flex border-b border-slate-200 bg-slate-50 sticky top-0 z-0">
                  {daysArray.map(day => {
                    const date = new Date(ganttMonthYear.year, ganttMonthYear.month, day);
                    const isWknd = date.getDay() === 0 || date.getDay() === 6;
                    const isTd = day === today.getDate() && ganttMonthYear.month === today.getMonth() && ganttMonthYear.year === today.getFullYear();
                    return (
                      <div key={day} style={{ width: COL_W }} className={`shrink-0 border-r flex flex-col items-center justify-center text-xs
                        ${isTd ? "border-indigo-400 bg-indigo-50 text-indigo-700" : isWknd ? "border-slate-200 bg-slate-100/80 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                        <span className="font-black">{day}</span>
                        <span className="text-[9px]">{["CN", "T2", "T3", "T4", "T5", "T6", "T7"][date.getDay()]}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Task bars */}
                <div className="relative">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {daysArray.map(day => {
                      const date = new Date(ganttMonthYear.year, ganttMonthYear.month, day);
                      const isWknd = date.getDay() === 0 || date.getDay() === 6;
                      const isTd = day === today.getDate() && ganttMonthYear.month === today.getMonth();
                      return (
                        <div key={day} style={{ width: COL_W }} className={`shrink-0 border-r h-full relative ${isWknd ? "bg-slate-50/70 border-slate-200" : "border-slate-100"} ${isTd ? "!border-indigo-300" : ""}`}>
                          {isTd && <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-indigo-400/60 -translate-x-1/2" />}
                        </div>
                      );
                    })}
                  </div>

                  {tasks.map((t) => {
                    // Compute bar position from StartDate and DueDate
                    const monthStart = new Date(ganttMonthYear.year, ganttMonthYear.month, 1);
                    const monthEnd = new Date(ganttMonthYear.year, ganttMonthYear.month, daysInMonth);

                    const rawStart = t.startDate ? new Date(t.startDate) : (t.dueDate ? new Date(t.dueDate) : null);
                    const rawEnd = t.dueDate ? new Date(t.dueDate) : (rawStart ? addDays(rawStart, 2) : null);

                    if (!rawStart || !rawEnd) {
                      return (
                        <div key={t.taskId} className="h-12 border-b border-slate-100 relative flex items-center">
                          <span className="absolute left-2 text-xs text-slate-300 italic">Chưa có ngày</span>
                        </div>
                      );
                    }

                    const clampedStart = isAfter(rawStart, monthEnd) ? null : rawStart;
                    const clampedEnd = isBefore(rawEnd, monthStart) ? null : rawEnd;

                    if (!clampedStart || !clampedEnd) {
                      return <div key={t.taskId} className="h-12 border-b border-slate-100" />;
                    }

                    const startDay = Math.max(0, differenceInDays(clampedStart, monthStart));
                    const endDay = Math.min(daysInMonth - 1, differenceInDays(clampedEnd, monthStart));
                    const barWidth = Math.max((endDay - startDay + 1) * COL_W - 6, 12);
                    const barLeft = startDay * COL_W + 3;

                    const barColor = t.priority === "High" ? "from-red-500 to-rose-500" :
                      t.priority === "Medium" ? "from-amber-400 to-orange-400" :
                      "from-indigo-500 to-indigo-600";

                    return (
                      <div key={t.taskId} className="h-12 border-b border-slate-100 relative group flex items-center">
                        {t.isMilestone ? (
                          // Milestone diamond
                          <button
                            onClick={() => setSelectedTaskId(t.taskId)}
                            style={{ left: barLeft + barWidth / 2 - 8 }}
                            className="absolute w-4 h-4 bg-purple-500 rotate-45 cursor-pointer hover:scale-110 transition-transform z-10"
                            title={t.title}
                          />
                        ) : (
                          <button
                            onClick={() => setSelectedTaskId(t.taskId)}
                            style={{ left: barLeft, width: barWidth }}
                            className={`absolute h-6 bg-gradient-to-r ${barColor} rounded-md cursor-pointer hover:brightness-110 transition-all z-10 overflow-hidden`}
                            title={`${t.title} | ${t.progress}%`}
                          >
                            {/* Progress fill */}
                            <div className="absolute inset-y-0 left-0 bg-black/20 rounded-md"
                              style={{ width: `${t.progress}%` }} />
                            {barWidth > 60 && (
                              <span className="absolute inset-0 flex items-center px-2 text-white text-[10px] font-bold truncate z-10">
                                {t.progress}%
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {activeTab === "list" && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 text-sm">Tất cả công việc ({tasks.length})</h3>
              <button onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">
                <Plus size={13}/> Thêm
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 w-8">#</th>
                    <th className="px-4 py-3">Tên nhiệm vụ</th>
                    <th className="px-4 py-3 w-28">Trạng thái</th>
                    <th className="px-4 py-3 w-24">Ưu tiên</th>
                    <th className="px-4 py-3 w-32">Người nhận</th>
                    <th className="px-4 py-3 w-28">Bắt đầu</th>
                    <th className="px-4 py-3 w-28">Hạn chót</th>
                    <th className="px-4 py-3 w-28">Tiến độ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((t, idx) => {
                    const isOverdue = t.dueDate && isBefore(new Date(t.dueDate), today) && t.status !== "Done";
                    return (
                      <tr key={t.taskId} onClick={() => setSelectedTaskId(t.taskId)}
                        className={`hover:bg-indigo-50 cursor-pointer transition-colors ${isOverdue ? "bg-red-50/30" : ""}`}>
                        <td className="px-4 py-3 text-xs text-slate-400 font-bold">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {t.isMilestone && <span className="text-purple-500 text-xs">◆</span>}
                            <span className="font-bold text-slate-800">{t.title}</span>
                            {isOverdue && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Quá hạn</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[t.status] ?? "bg-slate-100 text-slate-600"}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${PRIORITY_COLORS[t.priority] ?? ""}`}>
                            {PRIORITY_ICONS[t.priority]} {t.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {t.ownerId && usersMap[t.ownerId] ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar name={usersMap[t.ownerId]} />
                              <span className="text-xs text-slate-600 truncate max-w-[80px]">{usersMap[t.ownerId]}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{t.startDate ? format(new Date(t.startDate), "dd/MM/yyyy") : "—"}</td>
                        <td className={`px-4 py-3 text-xs font-bold ${isOverdue ? "text-red-500" : "text-slate-500"}`}>
                          {t.dueDate ? format(new Date(t.dueDate), "dd/MM/yyyy") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${t.progress}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-500 w-7">{t.progress}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {tasks.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-12 text-slate-400">Chưa có công việc nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CALENDAR ── */}
        {activeTab === "calendar" && (
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100/50 flex flex-col h-full ring-1 ring-slate-100">
            <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                    <CalendarIcon size={20} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-xl capitalize tracking-tight">Tháng {currentDate.getMonth() + 1}</h3>
                    <p className="text-xs font-bold text-slate-400">Năm {currentDate.getFullYear()}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleToday} className="px-5 py-2.5 bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 text-sm font-bold text-slate-700 rounded-xl transition-all active:scale-95">Hôm nay</button>
                <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-1 gap-1">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><ChevronLeft size={18} className="stroke-[2.5]"/></button>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"><ChevronRight size={18} className="stroke-[2.5]"/></button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-slate-200/60 bg-white/50 shrink-0">
              {["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"].map(day => (
                <div key={day} className="py-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest">{day}</div>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-slate-100/50 gap-[1px] p-[1px]">
              {(() => {
                const monthStart = startOfMonth(currentDate);
                const monthEnd = endOfMonth(monthStart);
                const startDate = startOfWeek(monthStart);
                const endDate = endOfWeek(monthEnd);
                const days = eachDayOfInterval({ start: startDate, end: endDate });
                return days.map(day => {
                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isTd = isSameDay(day, new Date());
                  const dailyTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));
                  return (
                    <div key={day.toISOString()} className={`relative bg-white p-2.5 flex flex-col min-h-[110px] transition-all cursor-pointer group
                      ${!isCurrentMonth ? "bg-slate-50/50" : "hover:bg-indigo-50/30"}`}
                      onClick={() => { setNewTask(p => ({ ...p, dueDate: format(day, "yyyy-MM-dd") })); setIsModalOpen(true); }}>
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full transition-all
                          ${isTd ? "bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md" : isCurrentMonth ? "text-slate-700 group-hover:text-indigo-600 group-hover:bg-indigo-100" : "text-slate-300"}`}>
                          {day.getDate()}
                        </span>
                        {dailyTasks.length > 0 && <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-full shadow-sm">{dailyTasks.length}</span>}
                      </div>
                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                        {dailyTasks.slice(0, 3).map(t => {
                          const cls = t.status === "Done" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            t.status === "In Progress" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-blue-50 text-blue-700 border-blue-200";
                          return (
                            <div key={t.taskId} className={`border text-[11px] font-semibold px-1.5 py-1 rounded-lg truncate shadow-sm ${cls}`}
                              onClick={e => { e.stopPropagation(); setSelectedTaskId(t.taskId); }} title={t.title}>
                              {t.title}
                            </div>
                          );
                        })}
                        {dailyTasks.length > 3 && <span className="text-[10px] text-slate-400 px-1">+{dailyTasks.length - 3} thêm</span>}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* ── WORKLOAD ── */}
        {activeTab === "workload" && (
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="grid grid-cols-3 gap-4 mb-2">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
                <p className="text-3xl font-black text-slate-800">{members.length}</p>
                <p className="text-sm text-slate-500 mt-1">Thành viên</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
                <p className="text-3xl font-black text-slate-800">{totalTasks}</p>
                <p className="text-sm text-slate-500 mt-1">Tổng task</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 shadow-sm text-center">
                <p className="text-3xl font-black text-red-600">{workloadArray.filter(w => w.count > 5).length}</p>
                <p className="text-sm text-red-400 mt-1">Quá tải</p>
              </div>
            </div>

            {workloadArray.map(w => {
              const isOverloaded = w.count > 5 || w.highPriority > 2;
              const ratio = w.count > 0 ? (w.done / w.count) * 100 : 0;
              return (
                <div key={w.name} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={w.name} size="lg" />
                      <div>
                        <h4 className="font-black text-slate-800">{w.name}</h4>
                        <p className="text-xs text-slate-500">{w.count} task • {w.highPriority} ưu tiên cao • {w.done} hoàn thành</p>
                      </div>
                    </div>
                    {isOverloaded && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                        <AlertTriangle size={13} /> Quá tải
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Khối lượng task</span><span>{w.count}/10 task</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isOverloaded ? "bg-gradient-to-r from-red-400 to-red-500" : "bg-gradient-to-r from-indigo-400 to-indigo-500"}`}
                        style={{ width: `${Math.min((w.count / 10) * 100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-2 mb-1">
                      <span>Tỉ lệ hoàn thành</span><span>{Math.round(ratio)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {workloadArray.length === 0 && (
              <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p>Chưa có công việc nào được giao trong dự án này</p>
              </div>
            )}
          </div>
        )}

        {/* ── BOARD ── */}
        {activeTab === "board" && (
          <div className="h-full flex flex-col">
            <div className="flex gap-6 overflow-x-auto pb-4 items-start h-full" style={{ scrollbarWidth: "thin" }}>
              {["To Do", "In Progress", "In Review", "Done"].map(status => {
                const columnTasks = tasks.filter(t => t.status === status);
                const colColors: Record<string, string> = {
                  "To Do": "border-slate-200",
                  "In Progress": "border-amber-200",
                  "In Review": "border-purple-200",
                  "Done": "border-emerald-200",
                };
                const headerColors: Record<string, string> = {
                  "To Do": "text-slate-600 bg-slate-50",
                  "In Progress": "text-amber-700 bg-amber-50",
                  "In Review": "text-purple-700 bg-purple-50",
                  "Done": "text-emerald-700 bg-emerald-50",
                };
                return (
                  <div key={status} className="min-w-[280px] w-72 flex-shrink-0 flex flex-col"
                    onDragOver={handleDragOver} onDrop={e => handleDrop(e, status)}>
                    <div className={`flex items-center justify-between mb-3 px-1 py-2 rounded-xl ${headerColors[status]}`}>
                      <h4 className="font-black text-sm uppercase tracking-wide">{status}</h4>
                      <span className="text-xs font-black w-6 h-6 rounded-full bg-white/70 flex items-center justify-center shadow-sm">{columnTasks.length}</span>
                    </div>
                    <div className={`space-y-3 flex-grow rounded-2xl min-h-[200px] p-3 bg-slate-100/50 border ${colColors[status]}`}>
                      {columnTasks.map(task => (
                        <div key={task.taskId} draggable onDragStart={e => handleDragStart(e, task.taskId)}
                          onClick={() => setSelectedTaskId(task.taskId)}
                          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group active:cursor-grabbing">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-sm text-slate-800 leading-snug flex-1 mr-2">{task.title}</h5>
                            <MoreVertical size={15} className="text-slate-300 shrink-0 group-hover:text-slate-500" />
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] ?? ""}`}>
                              {PRIORITY_ICONS[task.priority]} {task.priority}
                            </span>
                            {task.isMilestone && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">◆ Milestone</span>}
                          </div>
                          {task.progress > 0 && (
                            <div className="mb-3">
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${task.progress}%` }} />
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 text-right">{task.progress}%</p>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                            <span className="flex items-center gap-1"><CalendarIcon size={11}/> {task.dueDate ? format(new Date(task.dueDate), "dd/MM") : "—"}</span>
                            {task.ownerId && usersMap[task.ownerId] && <Avatar name={usersMap[task.ownerId]} />}
                          </div>
                        </div>
                      ))}
                      <button onClick={() => { setNewTask(p => ({ ...p, status })); setIsModalOpen(true); }}
                        className="w-full py-2.5 flex items-center justify-center gap-2 text-slate-400 font-bold text-sm hover:bg-slate-200 rounded-xl transition-colors border border-dashed border-slate-300 hover:text-slate-600">
                        <Plus size={15} /> Thêm task
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Task Creation Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Thêm công việc mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên công việc <span className="text-red-500">*</span></label>
                <input type="text" required value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nhập tên công việc..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái</label>
                  <select value={newTask.status} onChange={e => setNewTask({ ...newTask, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white">
                    <option value="To Do">Cần làm</option>
                    <option value="In Progress">Đang làm</option>
                    <option value="In Review">Chờ duyệt</option>
                    <option value="Done">Hoàn thành</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mức độ</label>
                  <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white">
                    <option value="Low">Thấp</option>
                    <option value="Normal">Bình thường</option>
                    <option value="Medium">Trung bình</option>
                    <option value="High">Cao</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày bắt đầu</label>
                  <input type="date" value={newTask.startDate} onChange={e => setNewTask({ ...newTask, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày đến hạn</label>
                  <input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ước tính (giờ)</label>
                <input type="number" step="0.5" min="0" value={newTask.estimatedHours}
                  onChange={e => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
                  placeholder="Ví dụ: 8" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50">Hủy</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">Tạo công việc</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── AI Risk Modal ── */}
      {isAiRiskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-rose-500" />
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <ShieldAlert size={24}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-800">AI Risk Analysis</h3>
                    <p className="text-sm text-slate-500">Phân tích rủi ro tiến độ dự án</p>
                  </div>
                </div>
                <button onClick={() => setIsAiRiskModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              {isAiAnalyzing ? (
                <div className="py-12 text-center space-y-4">
                  <Loader2 size={40} className="mx-auto text-orange-500 animate-spin"/>
                  <p className="font-bold text-slate-700">AI đang phân tích tiến độ...</p>
                </div>
              ) : riskReport ? (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                    <p className="text-sm font-medium text-orange-800 leading-relaxed">
                      Dự án có <strong>{riskReport.highRisk}</strong> task có khả năng cao trễ hạn. Đề xuất phân bổ thêm nguồn lực!
                    </p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Rủi ro cao (Quá hạn & chưa làm)", value: riskReport.highRisk, cls: "bg-red-50 text-red-700" },
                      { label: "Cần lưu ý", value: riskReport.mediumRisk, cls: "bg-amber-50 text-amber-700" },
                      { label: "An toàn (Đúng tiến độ)", value: riskReport.safe, cls: "bg-green-50 text-green-700" },
                    ].map(item => (
                      <div key={item.label} className={`flex justify-between items-center p-3 ${item.cls} rounded-xl`}>
                        <span className="font-bold text-sm">{item.label}</span>
                        <span className="font-black text-lg">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setIsAiRiskModalOpen(false)} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">Đã hiểu</button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── Invite Modal ── */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Mời thành viên</h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="p-5">
              <form onSubmit={handleInviteMember} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email người dùng</label>
                  <div className="flex gap-2">
                    <input type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="Nhập email..." />
                    <button type="submit" disabled={isInviting || !inviteEmail.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      {isInviting ? "..." : "Mời"}
                    </button>
                  </div>
                  {inviteMessage.text && (
                    <p className={`mt-2 text-xs font-bold ${inviteMessage.type === "error" ? "text-red-500" : "text-green-500"}`}>{inviteMessage.text}</p>
                  )}
                </div>
              </form>
              <h4 className="font-bold text-sm text-slate-700 mb-3">Thành viên ({members.length})</h4>
              <div className="space-y-3 max-h-52 overflow-y-auto">
                {members.map(m => (
                  <div key={m.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.fullName || m.email} size="md" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{m.fullName || m.email}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${m.role === "Admin" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"}`}>{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
