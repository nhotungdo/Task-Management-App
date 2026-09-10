"use client";

import React, { useEffect, useState } from "react";
import { Search, Plus, Calendar, MoreVertical } from "lucide-react";
import api from "@/lib/api";

interface Task {
  taskId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  ownerId?: string;
}

interface Workspace {
  workspaceId: string;
  name: string;
}

export default function TasksPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWsId, setActiveWsId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        let wsData, usersData;
        try { wsData = (await api.get("/Workspaces")).data; } catch (e) {}
        try { usersData = (await api.get("/Users")).data; } catch (e) {}

        if (wsData && wsData.length > 0) {
          setWorkspaces(wsData);
          setActiveWsId(wsData[0].workspaceId);
        }
        
        const uMap: Record<string, string> = {};
        if (usersData) {
          usersData.forEach((u: any) => { uMap[u.userId] = u.fullName || u.email; });
        }
        setUsersMap(uMap);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitData();
  }, []);

  useEffect(() => {
    if (activeWsId) {
      setLoading(true);
      api.get(`/Tasks?workspaceId=${activeWsId}`)
        .then(res => setTasks(res.data.items || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [activeWsId]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-tl-[2rem] border-l border-t border-slate-100 shadow-sm">
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Danh sách Công việc</h2>
          <p className="text-sm text-slate-500 font-medium">Quản lý và cập nhật tiến độ công việc chi tiết</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={activeWsId || ""} 
            onChange={e => setActiveWsId(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            {workspaces.map(ws => (
              <option key={ws.workspaceId} value={ws.workspaceId}>{ws.name}</option>
            ))}
            {workspaces.length === 0 && <option value="">Không có dự án</option>}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm công việc..." 
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-blue-500 w-[250px]"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700">
            <Plus size={16} /> Tạo công việc
          </button>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">Đang tải danh sách công việc...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Dự án này chưa có công việc nào.
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Tên công việc</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Mức độ</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Người nhận</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Hạn chót</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map(t => (
                  <tr key={t.taskId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-sm text-slate-800">{t.title}</p>
                      {t.description && <p className="text-xs text-slate-500 truncate w-64 mt-1">{t.description}</p>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full 
                        ${t.status === 'Done' ? 'bg-green-100 text-green-700' : 
                          t.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 
                          t.status === 'In Review' ? 'bg-purple-100 text-purple-700' : 
                          'bg-blue-100 text-blue-700'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border
                        ${t.priority === 'High' ? 'border-red-200 text-red-600 bg-red-50' : 
                          t.priority === 'Medium' ? 'border-amber-200 text-amber-600 bg-amber-50' : 
                          'border-blue-200 text-blue-600 bg-blue-50'}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                        <span className="text-xs font-bold text-slate-700">
                          {t.ownerId ? usersMap[t.ownerId] || 'Không xác định' : 'Chưa giao'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {t.dueDate ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(t.dueDate).toLocaleDateString('vi-VN')}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Không có</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
