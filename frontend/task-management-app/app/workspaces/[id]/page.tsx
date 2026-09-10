"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
  BarChart3, LayoutGrid, Calendar as CalendarIcon, 
  List, GitCommit, MoreVertical, Plus, CheckCircle2,
  X, Users, AlertTriangle, Sparkles, ShieldAlert, Loader2
} from "lucide-react";
import api from "@/lib/api";

interface Task {
  taskId: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  ownerId?: string;
}

interface Workspace {
  workspaceId: string;
  name: string;
  description?: string;
}

export default function WorkspaceDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params.id as string;
  
  const defaultTab = searchParams.get('tab') || 'board';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", status: "To Do", priority: "Medium", dueDate: "" });

  // AI Risk State
  const [isAiRiskModalOpen, setIsAiRiskModalOpen] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [riskReport, setRiskReport] = useState<{highRisk: number, mediumRisk: number, safe: number} | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/workspaces/${workspaceId}?tab=${tab}`);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let usersData;
      try { usersData = (await api.get("/Users")).data; } catch (e) {}

      const uMap: Record<string, string> = {};
      if (usersData) {
        usersData.forEach((u: any) => { uMap[u.userId] = u.fullName || u.email; });
      }
      setUsersMap(uMap);

      const [wsRes, taskRes] = await Promise.all([
        api.get(`/Workspaces/${workspaceId}`),
        api.get(`/Tasks?workspaceId=${workspaceId}`)
      ]);
      setWorkspace(wsRes.data);
      setTasks(taskRes.data.items || []);
    } catch (err) {
      console.error("Failed to load workspace data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId]);

  // Drag and Drop Handlers for Kanban
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;
    const taskToUpdate = tasks.find(t => t.taskId === taskId);
    if (!taskToUpdate || taskToUpdate.status === newStatus) return;

    setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.put(`/Tasks/${taskId}`, { ...taskToUpdate, status: newStatus });
    } catch (err) {
      loadData(); 
    }
  };

  // Task Creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await api.post("/Tasks", {
        title: newTask.title,
        description: newTask.description,
        workspaceId: workspaceId,
        status: newTask.status,
        priority: newTask.priority,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null
      });
      setIsModalOpen(false);
      setNewTask({ title: "", description: "", status: "To Do", priority: "Medium", dueDate: "" });
      loadData();
    } catch (err) {
      console.error("Failed to create task");
    }
  };

  const handleAiAnalyze = () => {
    setIsAiRiskModalOpen(true);
    setIsAiAnalyzing(true);
    setRiskReport(null);
    
    setTimeout(() => {
      // Mock logic to determine risk
      let highRisk = 0;
      let mediumRisk = 0;
      let safe = 0;
      
      tasks.forEach(t => {
        if (t.status === "Done") {
          safe++;
          return;
        }
        if (t.priority === "High" && t.status === "To Do") {
          highRisk++;
        } else if (t.status === "In Progress" || t.priority === "Medium") {
          mediumRisk++;
        } else {
          safe++;
        }
      });
      
      setRiskReport({ highRisk, mediumRisk, safe });
      setIsAiAnalyzing(false);
    }, 2000);
  };

  // Gantt Chart Logic (Current Month Mockup)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Workload Logic
  const workloadMap: Record<string, { count: number, highPriority: number }> = {};
  tasks.forEach(t => {
    const owner = t.ownerId || 'unassigned';
    if (!workloadMap[owner]) workloadMap[owner] = { count: 0, highPriority: 0 };
    workloadMap[owner].count += 1;
    if (t.priority === 'High') workloadMap[owner].highPriority += 1;
  });
  const workloadArray = Object.entries(workloadMap).map(([id, data]) => ({
    ownerId: id,
    name: id === 'unassigned' ? 'Chưa phân công' : (usersMap[id] || 'Người dùng ẩn'),
    count: data.count,
    high: data.highPriority
  })).sort((a, b) => b.count - a.count);

  if (loading) return <div className="p-8 text-slate-500">Đang tải dữ liệu dự án...</div>;
  if (!workspace) return <div className="p-8 text-red-500">Không tìm thấy dự án</div>;

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
    { id: 'board', label: 'Bảng (Kanban)', icon: LayoutGrid },
    { id: 'gantt', label: 'Gantt Chart', icon: GitCommit },
    { id: 'calendar', label: 'Lịch', icon: CalendarIcon },
    { id: 'list', label: 'Danh sách', icon: List },
    { id: 'workload', label: 'Năng suất (Workload)', icon: Users },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-tl-[2rem] border-l border-t border-slate-100 shadow-sm relative">
      {/* Header */}
      <header className="px-8 pt-6 pb-0 border-b border-slate-100 shrink-0">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-1">{workspace.name}</h2>
            <p className="text-sm text-slate-500 font-medium">{workspace.description || 'Không có mô tả'}</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleAiAnalyze}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all"
            >
              <ShieldAlert size={16} /> AI Phân tích rủi ro
            </button>
            <div className="flex -space-x-2 ml-2 mr-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100"></div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100"></div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-fuchsia-100"></div>
            </div>
            <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200">
              Chia sẻ
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-6 overflow-x-auto custom-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 pb-4 border-b-2 transition-colors whitespace-nowrap font-bold text-sm
                  ${isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar">
        
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="text-center py-20">
            <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">Tổng quan dự án</h3>
            <p className="text-slate-500">Các biểu đồ thống kê chuyên sâu sẽ được cập nhật ở Giai đoạn 3.</p>
          </div>
        )}

        {/* GANTT CHART */}
        {activeTab === 'gantt' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-800">Tiến độ tháng {currentMonth + 1}/{currentYear}</h3>
              <div className="flex gap-3 text-xs font-bold">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400 rounded"></div> Cần làm</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-400 rounded"></div> Đang làm</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 rounded"></div> Hoàn thành</span>
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar flex relative">
              {/* Left sidebar (Tasks) */}
              <div className="w-64 border-r border-slate-200 shrink-0 bg-white z-10 sticky left-0">
                <div className="h-10 border-b border-slate-200 bg-slate-50"></div>
                {tasks.map(t => (
                  <div key={t.taskId} className="h-12 border-b border-slate-100 flex items-center px-4">
                    <span className="text-xs font-bold text-slate-700 truncate" title={t.title}>{t.title}</span>
                  </div>
                ))}
              </div>
              {/* Right timeline */}
              <div className="flex-1 relative" style={{ minWidth: `${daysInMonth * 40}px` }}>
                {/* Header days */}
                <div className="h-10 flex border-b border-slate-200 bg-slate-50">
                  {daysArray.map(day => (
                    <div key={day} className="w-[40px] shrink-0 border-r border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Timeline Grid */}
                <div className="relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {daysArray.map(day => (
                      <div key={day} className="w-[40px] shrink-0 border-r border-slate-100 h-full"></div>
                    ))}
                  </div>
                  {/* Task Bars */}
                  {tasks.map((t, idx) => {
                    const startDay = new Date(t.createdAt).getDate();
                    const endDay = t.dueDate ? new Date(t.dueDate).getDate() : startDay + 2; // Default to 3 days if no due date
                    const validEndDay = Math.min(Math.max(endDay, startDay), daysInMonth);
                    const left = (startDay - 1) * 40;
                    const width = ((validEndDay - startDay) + 1) * 40;
                    const color = t.status === 'Done' ? 'bg-green-400' : t.status === 'In Progress' ? 'bg-amber-400' : 'bg-blue-400';
                    
                    return (
                      <div key={t.taskId} className="h-12 border-b border-slate-100 relative group">
                        <div 
                          className={`absolute top-2 h-8 ${color} rounded-md shadow-sm flex items-center px-2 cursor-pointer hover:brightness-110 transition-all`}
                          style={{ left: `${left}px`, width: `${width}px` }}
                          title={`${t.title} (${startDay}/${currentMonth+1} - ${validEndDay}/${currentMonth+1})`}
                        >
                          <span className="text-[10px] font-bold text-white truncate">{t.title}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-800">Tháng {currentMonth + 1}/{currentYear}</h3>
            </div>
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 shrink-0">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 border-r border-slate-200 last:border-0">{day}</div>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-slate-100 gap-[1px]">
              {/* Just generate 35 boxes for simplicity */}
              {Array.from({length: 35}).map((_, i) => {
                const dayNum = i - new Date(currentYear, currentMonth, 1).getDay() + 1;
                const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                const dailyTasks = isCurrentMonth ? tasks.filter(t => t.dueDate && new Date(t.dueDate).getDate() === dayNum) : [];
                return (
                  <div key={i} className={`bg-white p-2 flex flex-col min-h-[100px] ${!isCurrentMonth ? 'opacity-50 bg-slate-50' : ''}`}>
                    <span className="text-xs font-bold text-slate-400 mb-1">{isCurrentMonth ? dayNum : ''}</span>
                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                      {dailyTasks.map(t => (
                        <div key={t.taskId} className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-1 rounded truncate cursor-pointer hover:bg-indigo-100" title={t.title}>
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WORKLOAD */}
        {activeTab === 'workload' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 mb-2">Tải công việc (Workload)</h3>
              <p className="text-sm text-slate-500 mb-8">Theo dõi khối lượng công việc của từng thành viên trong dự án để phân bổ nguồn lực hợp lý.</p>
              
              <div className="space-y-6">
                {workloadArray.map((w, idx) => {
                  const isOverloaded = w.count > 5 || w.high > 2; // Arbitrary logic for MVP
                  return (
                    <div key={w.ownerId} className="flex flex-col gap-2">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                            {w.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{w.name}</h4>
                            <p className="text-xs text-slate-500">{w.count} công việc • {w.high} ưu tiên cao</p>
                          </div>
                        </div>
                        {isOverloaded && (
                          <div className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                            <AlertTriangle size={14} /> Quá tải
                          </div>
                        )}
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                        <div className={`h-full ${isOverloaded ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((w.count / 10) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                {workloadArray.length === 0 && (
                  <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Chưa có công việc nào được giao trong dự án này.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {activeTab === 'list' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-bold">Tên công việc</th>
                  <th className="px-6 py-3 font-bold">Trạng thái</th>
                  <th className="px-6 py-3 font-bold">Mức độ</th>
                  <th className="px-6 py-3 font-bold">Hạn chót</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map(t => (
                  <tr key={t.taskId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-800">{t.title}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{t.status}</td>
                    <td className="px-6 py-4 font-bold">
                      <span className={`px-2 py-1 rounded text-[10px] ${t.priority === 'High' ? 'bg-red-50 text-red-600' : t.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{t.priority}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('vi-VN') : '-'}</td>
                  </tr>
                ))}
                {tasks.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-slate-500">Chưa có công việc nào</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* BOARD VIEW */}
        {activeTab === 'board' && (
          <div className="h-full flex flex-col">
            <div className="flex justify-end mb-4">
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-700 shadow-sm">
                <Plus size={16} /> Thêm công việc
              </button>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 items-start h-full custom-scrollbar">
              {['To Do', 'In Progress', 'In Review', 'Done'].map(status => {
                const columnTasks = tasks.filter(t => t.status === status);
                return (
                  <div key={status} className="min-w-[280px] flex-1 flex flex-col" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}>
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wide">{status}</h4>
                      <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                    </div>
                    <div className="space-y-3 flex-grow rounded-xl min-h-[200px] p-2 bg-slate-100/50 border border-slate-200/60">
                      {columnTasks.map(task => (
                        <div key={task.taskId} draggable onDragStart={(e) => handleDragStart(e, task.taskId)} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-grab active:cursor-grabbing">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-sm text-slate-800 leading-snug">{task.title}</h5>
                            <MoreVertical size={16} className="text-slate-400 shrink-0 cursor-pointer hover:text-slate-600" />
                          </div>
                          <div className={`inline-block text-[10px] font-bold px-2 py-1 rounded mb-3 ${task.priority === 'High' ? 'bg-red-50 text-red-600' : task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {task.priority}
                          </div>
                          <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                            <span className="flex items-center gap-1"><CalendarIcon size={12}/> {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'No due'}</span>
                            <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => { setNewTask(prev => ({...prev, status})); setIsModalOpen(true); }} className="w-full py-2.5 flex items-center justify-center gap-2 text-slate-500 font-bold text-sm hover:bg-slate-200 rounded-lg transition-colors border border-dashed border-slate-300">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Thêm công việc mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên công việc <span className="text-red-500">*</span></label>
                <input type="text" required value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Nhập tên công việc..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái</label>
                  <select value={newTask.status} onChange={(e) => setNewTask({...newTask, status: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white">
                    <option value="To Do">Cần làm</option>
                    <option value="In Progress">Đang làm</option>
                    <option value="In Review">Chờ duyệt</option>
                    <option value="Done">Hoàn thành</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mức độ</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white">
                    <option value="Low">Thấp</option>
                    <option value="Medium">Trung bình</option>
                    <option value="High">Cao</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors">Hủy</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">Tạo công việc</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Risk Analysis Modal */}
      {isAiRiskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-rose-500"></div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <ShieldAlert size={24} />
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
                  <Loader2 size={40} className="mx-auto text-orange-500 animate-spin" />
                  <p className="font-bold text-slate-700">AI đang phân tích tiến độ các công việc...</p>
                </div>
              ) : riskReport ? (
                <div className="space-y-6">
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                    <p className="text-sm font-medium text-orange-800 leading-relaxed">
                      Dựa trên tốc độ hiện tại và hạn chót, AI nhận thấy có <strong>{riskReport.highRisk}</strong> công việc có khả năng cao sẽ bị trễ hạn. Đề xuất phân bổ thêm nguồn lực!
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-red-50 text-red-700 rounded-xl">
                      <span className="font-bold text-sm">Rủi ro cao (Trễ hạn)</span>
                      <span className="font-black text-lg">{riskReport.highRisk}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-50 text-amber-700 rounded-xl">
                      <span className="font-bold text-sm">Cần lưu ý</span>
                      <span className="font-black text-lg">{riskReport.mediumRisk}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 text-green-700 rounded-xl">
                      <span className="font-bold text-sm">An toàn (Đúng tiến độ)</span>
                      <span className="font-black text-lg">{riskReport.safe}</span>
                    </div>
                  </div>
                  <button onClick={() => setIsAiRiskModalOpen(false)} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                    Đã hiểu
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
