"use client";

import React, { useEffect, useState } from "react";
import { FolderKanban, Plus, MoreVertical, Calendar } from "lucide-react";
import api from "@/lib/api";

interface Workspace {
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Workspaces");
      setWorkspaces(res.data);
    } catch (err) {
      console.error("Failed to load workspaces", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/Workspaces", { name: newName, description: newDesc });
      setNewName("");
      setNewDesc("");
      setIsCreating(false);
      await loadWorkspaces();
    } catch (err) {
      console.error("Failed to create workspace");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-tl-[2rem] border-l border-t border-slate-100 shadow-sm">
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dự án của bạn</h2>
          <p className="text-sm text-slate-500 font-medium">Quản lý các không gian làm việc</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700"
        >
          <Plus size={16} /> Tạo dự án mới
        </button>
      </header>

      <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
        {isCreating && (
          <div className="bg-blue-50 rounded-2xl p-6 mb-8 border border-blue-100 relative shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Dự án mới</h3>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tên dự án</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" 
                  placeholder="Nhập tên dự án..."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" 
                  placeholder="Mô tả ngắn gọn..."
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="submit" 
                  disabled={submitting || !newName.trim()}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Đang tạo...' : 'Lưu dự án'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500 font-medium">Đang tải dữ liệu...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {workspaces.map(ws => (
              <div key={ws.workspaceId} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <FolderKanban size={24} />
                  </div>
                  <button className="text-slate-400 hover:text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={20} />
                  </button>
                </div>
                <h4 className="font-bold text-lg text-slate-800 mb-2 truncate" title={ws.name}>{ws.name}</h4>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-grow" title={ws.description}>
                  {ws.description || "Không có mô tả"}
                </p>
                <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Calendar size={14} />
                    <span>{new Date(ws.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <a href={`/?workspaceId=${ws.workspaceId}`} className="text-sm font-bold text-blue-600 hover:underline">
                    Mở dự án
                  </a>
                </div>
              </div>
            ))}
            {workspaces.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Bạn chưa có dự án nào. Hãy tạo một dự án mới để bắt đầu quản lý công việc!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
