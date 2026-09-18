/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Tag as TagIcon, Plus, X, Check } from "lucide-react";
import api from "@/lib/api";

interface Tag {
  tagId: string;
  name: string;
  color: string;
}

interface TagsManagerProps {
  workspaceId: string;
}

const TAG_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
  "#22C55E", "#10B981", "#14B8A8", "#06B6D4", "#0EA5E9",
  "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF",
  "#EC4899", "#DB2777", "#F43F5E", "#6B7280", "#9CA3AF"
];

export default function TagsManager({ workspaceId }: TagsManagerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[9]);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/tags`);
      setTags(res.data || []);
    } catch {
      console.error("Failed to load tags");
      setTags([]);
    } finally {
      setLoading(false);
    }
  };
 

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchTags(); }, [workspaceId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setIsCreating(true);
    setErrorMsg("");
    try {
      await api.post(`/workspaces/${workspaceId}/tags`, { name: newTagName.trim(), color: newTagColor });
      setNewTagName("");
      setNewTagColor(TAG_COLORS[9]);
      fetchTags();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Không thể tạo nhãn.";
      setErrorMsg(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (tagId: string, tagName: string) => {
    if (!confirm(`Xóa nhãn "${tagName}"? Các công việc vẫn giữ lại nhưng sẽ mất nhãn này.`)) return;
    try {
      await api.delete(`/workspaces/${workspaceId}/tags/${tagId}`);
      fetchTags();
    } catch {
      console.error("Failed to delete tag");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800">Quản lý nhãn (Tags)</h3>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{tags.length} nhãn</span>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <X size={14} />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-2 items-end">
        <div className="flex-1">
          <input
            type="text"
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            placeholder="Tên nhãn mới..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            disabled={isCreating}
          />
        </div>
        <div className="flex gap-1 items-center">
          {TAG_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setNewTagColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                newTagColor === c ? "ring-2 ring-offset-1 ring-indigo-500" : "hover:scale-110"
              }`}
              style={{ backgroundColor: c, borderColor: c === "#6B7280" ? "#9CA3AF" : c }}
              title={c}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={isCreating || !newTagName.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
        >
          <Plus size={12} />
          Thêm
        </button>
      </form>

      {loading ? (
        <div className="text-center py-8 text-slate-400">Đang tải...</div>
      ) : tags.length === 0 ? (
        <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
          <TagIcon size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Chưa có nhãn nào. Tạo nhãn đầu tiên để phân loại công việc!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tags.map(tag => (
            <div key={tag.tagId} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all group">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className="font-bold text-sm text-slate-800">{tag.name}</span>
              </div>
              <button
                onClick={() => handleDelete(tag.tagId, tag.name)}
                className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Xóa nhãn"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
