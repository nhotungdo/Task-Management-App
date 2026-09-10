"use client";

import React, { useEffect, useState } from "react";
import { 
  Search, Filter, Plus, Bell, MessageSquare, Settings, 
  MoreVertical, Calendar, Clock, BarChart3, ChevronDown, CheckCircle2, X
} from "lucide-react";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import { 
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement
} from "chart.js";
import api from "@/lib/api";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

interface Workspace {
  workspaceId: string;
  name: string;
}

interface Task {
  taskId: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  ownerId?: string;
  description?: string;
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", status: "To Do", priority: "Medium", dueDate: "" });

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        let wsData, usersData, notifData;
        try { wsData = (await api.get("/Workspaces")).data; } catch (e) { console.warn("Failed to load workspaces"); }
        try { usersData = (await api.get("/Users")).data; } catch (e) { console.warn("Failed to load users"); }
        try { notifData = (await api.get("/Notifications")).data; } catch (e) { console.warn("Failed to load notifications"); }

        if (wsData && wsData.length > 0) {
          setWorkspaces(wsData);
          setActiveWorkspaceId(wsData[0].workspaceId);
        }

        const uMap: Record<string, string> = {};
        if (usersData) {
          usersData.forEach((u: any) => {
            uMap[u.userId] = u.fullName || u.email || 'Người dùng';
          });
        }
        setUsersMap(uMap);

        if (notifData) {
          setNotifications(notifData);
        }
      } catch (err) {
        console.error("Failed to load initial data");
      }
    };
    fetchInitData();
  }, []);

  const fetchTasks = () => {
    if (activeWorkspaceId) {
      setLoading(true);
      api.get(`/Tasks?workspaceId=${activeWorkspaceId}`)
        .then(res => setTasks(res.data.items || []))
        .catch(() => console.error("Failed to load tasks"))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeWorkspaceId]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    const taskToUpdate = tasks.find(t => t.taskId === taskId);
    if (!taskToUpdate || taskToUpdate.status === newStatus) return;

    // Optimistic UI Update
    setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, status: newStatus } : t));

    try {
      await api.put(`/Tasks/${taskId}`, { ...taskToUpdate, status: newStatus });
    } catch (err) {
      console.error("Failed to update status");
      fetchTasks(); // Revert on failure
    }
  };

  // Toggle Checkbox
  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "Done" ? "To Do" : "Done";
    setTasks(prev => prev.map(t => t.taskId === task.taskId ? { ...t, status: newStatus } : t));
    try {
      await api.put(`/Tasks/${task.taskId}`, { ...task, status: newStatus });
    } catch (error) {
      fetchTasks();
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId || !newTask.title.trim()) return;
    try {
      await api.post("/Tasks", {
        title: newTask.title,
        description: newTask.description,
        workspaceId: activeWorkspaceId,
        status: newTask.status,
        priority: newTask.priority,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null
      });
      setIsModalOpen(false);
      setNewTask({ title: "", description: "", status: "To Do", priority: "Medium", dueDate: "" });
      fetchTasks();
    } catch (err) {
      console.error("Failed to create task");
    }
  };

  const openModalForStatus = (status: string) => {
    setNewTask(prev => ({ ...prev, status }));
    setIsModalOpen(true);
  };

  const todoTasks = tasks.filter(t => t.status === "To Do");
  const inProgressTasks = tasks.filter(t => t.status === "In Progress");
  const inReviewTasks = tasks.filter(t => t.status === "In Review");
  const doneTasks = tasks.filter(t => t.status === "Done");

  const totalTasks = tasks.length;
  const completedTasks = doneTasks.length;
  const inProgressCount = inProgressTasks.length;

  const donutData = {
    labels: ['Completed', 'In Progress', 'To Do'],
    datasets: [{
      data: totalTasks === 0 ? [0,0,100] : [completedTasks, inProgressCount, totalTasks - completedTasks - inProgressCount],
      backgroundColor: ['#3b82f6', '#f59e0b', '#e2e8f0'],
      borderWidth: 0,
      cutout: '75%',
    }]
  };

  const priorityData = {
    high: tasks.filter(t => t.priority === "High").length,
    medium: tasks.filter(t => t.priority === "Medium").length,
    low: tasks.filter(t => t.priority === "Low").length,
  };

  const workloadMap: Record<string, number> = {};
  tasks.forEach(t => {
    if (t.ownerId) {
      workloadMap[t.ownerId] = (workloadMap[t.ownerId] || 0) + 1;
    }
  });
  const workloadArray = Object.entries(workloadMap).map(([id, count]) => ({
    ownerId: id,
    name: usersMap[id] || 'Người dùng ẩn',
    count,
    percentage: totalTasks ? Math.round((count / totalTasks) * 100) : 0
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-tl-[2rem] border-l border-t border-slate-100 shadow-sm relative">
      
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">Công việc</h2>
            {workspaces.length > 0 && (
              <select 
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer font-semibold outline-none"
                value={activeWorkspaceId || ""}
                onChange={(e) => setActiveWorkspaceId(e.target.value)}
              >
                {workspaces.map(ws => (
                  <option key={ws.workspaceId} value={ws.workspaceId}>{ws.name}</option>
                ))}
              </select>
            )}
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">Quản lý và theo dõi công việc nhóm</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-blue-500 w-[300px]"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-semibold hover:bg-slate-50 transition-colors">
            <Filter size={16} /> Lọc
          </button>
          <button 
            onClick={() => openModalForStatus("To Do")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Thêm công việc
          </button>
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
            <Bell size={20} className="text-slate-500 hover:text-slate-800 cursor-pointer" />
            <MessageSquare size={20} className="text-slate-500 hover:text-slate-800 cursor-pointer" />
            <Settings size={20} className="text-slate-500 hover:text-slate-800 cursor-pointer" />
            <div className="w-8 h-8 bg-blue-100 rounded-full ml-2 overflow-hidden flex items-center justify-center text-blue-600 font-bold">
              <span className="text-xs">U</span>
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-3 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">Tổng số công việc</p>
              <h3 className="text-3xl font-bold text-slate-800">{totalTasks}</h3>
            </div>
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Calendar size={28} />
            </div>
          </div>
          
          <div className="col-span-3 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">Đang thực hiện</p>
              <h3 className="text-3xl font-bold text-slate-800">{inProgressCount}</h3>
            </div>
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
              <BarChart3 size={28} />
            </div>
          </div>

          <div className="col-span-3 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">Đã hoàn thành</p>
              <h3 className="text-3xl font-bold text-slate-800">{completedTasks}</h3>
            </div>
            <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <CheckCircle2 size={28} />
            </div>
          </div>

          <div className="col-span-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center">
            <div className="w-16 h-16 mr-4 relative">
              <Doughnut data={donutData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800 mb-2">Tiến độ công việc</p>
              <ul className="text-[10px] font-semibold space-y-1">
                <li className="flex justify-between items-center"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Hoàn thành</span> <span>{totalTasks ? Math.round((completedTasks/totalTasks)*100) : 0}%</span></li>
                <li className="flex justify-between items-center"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Đang làm</span> <span>{totalTasks ? Math.round((inProgressCount/totalTasks)*100) : 0}%</span></li>
                <li className="flex justify-between items-center"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200"></div> Cần làm</span> <span>{totalTasks ? Math.round(((totalTasks - completedTasks - inProgressCount)/totalTasks)*100) : 0}%</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Grid: Kanban (left) and Sidebars (right) */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left: Kanban Board */}
          <div className="col-span-8 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800">Bảng Công việc (Kanban)</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Sắp xếp: Mức độ</span>
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <div className="bg-white p-1 rounded shadow-sm"><LayoutGrid size={16} className="text-slate-600" /></div>
                  <div className="p-1 rounded"><BarChart3 size={16} className="text-slate-400" /></div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start h-full">
              
              {/* Cột Cần làm */}
              <div 
                className="min-w-[220px] flex-1 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "To Do")}
              >
                <div className="flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-lg font-bold text-sm mb-4">
                  <span>Cần làm</span>
                  <span className="bg-white px-2 rounded text-xs">{todoTasks.length}</span>
                </div>
                <div className="space-y-4 flex-grow rounded-lg min-h-[150px] p-1 bg-slate-50/50">
                  {todoTasks.map(task => (
                    <div 
                      key={task.taskId} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.taskId)}
                      className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                          <h4 className="font-bold text-sm text-slate-800 truncate w-32" title={task.title}>{task.title}</h4>
                        </div>
                        <MoreVertical size={16} className="text-slate-400 shrink-0 cursor-pointer" />
                      </div>
                      <div className={`inline-block text-[10px] font-bold px-2 py-1 rounded mb-4 ${task.priority === 'High' ? 'bg-red-50 text-red-600' : task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{task.priority}</div>
                      <div className="flex justify-between items-center text-xs text-slate-400 font-medium border-t border-slate-50 pt-3">
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không có hạn'}</span>
                        <div className="w-6 h-6 rounded-full bg-slate-200" title={task.ownerId ? usersMap[task.ownerId] : ''}></div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => openModalForStatus("To Do")} className="w-full py-2 flex items-center justify-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-100 transition-colors rounded-lg mt-2">
                    <Plus size={16} /> Thêm việc
                  </button>
                </div>
              </div>

              {/* Cột Đang làm */}
              <div 
                className="min-w-[220px] flex-1 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "In Progress")}
              >
                <div className="flex items-center justify-between bg-amber-50 text-amber-700 px-3 py-2 rounded-lg font-bold text-sm mb-4">
                  <span>Đang làm</span>
                  <span className="bg-white px-2 rounded text-xs">{inProgressTasks.length}</span>
                </div>
                <div className="space-y-4 flex-grow rounded-lg min-h-[150px] p-1 bg-slate-50/50">
                  {inProgressTasks.map(task => (
                    <div 
                      key={task.taskId} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.taskId)}
                      className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                          <h4 className="font-bold text-sm text-slate-800 truncate w-32" title={task.title}>{task.title}</h4>
                        </div>
                        <MoreVertical size={16} className="text-slate-400 shrink-0" />
                      </div>
                      <div className={`inline-block text-[10px] font-bold px-2 py-1 rounded mb-4 ${task.priority === 'High' ? 'bg-red-50 text-red-600' : task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{task.priority}</div>
                      <div className="flex justify-between items-center text-xs text-slate-400 font-medium border-t border-slate-50 pt-3">
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không có hạn'}</span>
                        <div className="w-6 h-6 rounded-full bg-slate-200" title={task.ownerId ? usersMap[task.ownerId] : ''}></div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => openModalForStatus("In Progress")} className="w-full py-2 flex items-center justify-center gap-2 text-amber-600 font-bold text-sm hover:bg-amber-100 transition-colors rounded-lg mt-2">
                    <Plus size={16} /> Thêm việc
                  </button>
                </div>
              </div>

              {/* Cột Chờ duyệt */}
              <div 
                className="min-w-[220px] flex-1 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "In Review")}
              >
                <div className="flex items-center justify-between bg-purple-50 text-purple-700 px-3 py-2 rounded-lg font-bold text-sm mb-4">
                  <span>Chờ duyệt</span>
                  <span className="bg-white px-2 rounded text-xs">{inReviewTasks.length}</span>
                </div>
                <div className="space-y-4 flex-grow rounded-lg min-h-[150px] p-1 bg-slate-50/50">
                  {inReviewTasks.map(task => (
                    <div 
                      key={task.taskId} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.taskId)}
                      className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                          <h4 className="font-bold text-sm text-slate-800 truncate w-32" title={task.title}>{task.title}</h4>
                        </div>
                        <MoreVertical size={16} className="text-slate-400 shrink-0" />
                      </div>
                      <div className={`inline-block text-[10px] font-bold px-2 py-1 rounded mb-4 ${task.priority === 'High' ? 'bg-red-50 text-red-600' : task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{task.priority}</div>
                      <div className="flex justify-between items-center text-xs text-slate-400 font-medium border-t border-slate-50 pt-3">
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không có hạn'}</span>
                        <div className="w-6 h-6 rounded-full bg-slate-200" title={task.ownerId ? usersMap[task.ownerId] : ''}></div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => openModalForStatus("In Review")} className="w-full py-2 flex items-center justify-center gap-2 text-purple-600 font-bold text-sm hover:bg-purple-100 transition-colors rounded-lg mt-2">
                    <Plus size={16} /> Thêm việc
                  </button>
                </div>
              </div>

              {/* Cột Hoàn thành */}
              <div 
                className="min-w-[220px] flex-1 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, "Done")}
              >
                <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2 rounded-lg font-bold text-sm mb-4">
                  <span>Hoàn thành</span>
                  <span className="bg-white px-2 rounded text-xs">{doneTasks.length}</span>
                </div>
                <div className="space-y-4 flex-grow rounded-lg min-h-[150px] p-1 bg-slate-50/50">
                  {doneTasks.map(task => (
                    <div 
                      key={task.taskId} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.taskId)}
                      className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                          <h4 className="font-bold text-sm text-slate-800 truncate w-32 line-through opacity-70" title={task.title}>{task.title}</h4>
                        </div>
                        <MoreVertical size={16} className="text-slate-400 shrink-0" />
                      </div>
                      <div className={`inline-block text-[10px] font-bold px-2 py-1 rounded mb-4 ${task.priority === 'High' ? 'bg-red-50 text-red-600' : task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{task.priority}</div>
                      <div className="flex justify-between items-center text-xs text-slate-400 font-medium border-t border-slate-50 pt-3">
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không có hạn'}</span>
                        <CheckCircle2 size={20} className="text-green-500" />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => openModalForStatus("Done")} className="w-full py-2 flex items-center justify-center gap-2 text-green-600 font-bold text-sm hover:bg-green-100 transition-colors rounded-lg mt-2">
                    <Plus size={16} /> Thêm việc
                  </button>
                </div>
              </div>
            </div>
            
            {/* Timeline & Workload (Bottom Left) */}
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm text-slate-800">Dòng thời gian (Hoạt động)</h4>
                  <a href="#" className="text-xs font-bold text-blue-600">Xem tất cả</a>
                </div>
                <div className="space-y-4">
                  {notifications.length > 0 ? notifications.slice(0, 5).map((n, idx) => {
                    const d = new Date(n.createdAt);
                    return (
                      <div key={n.notificationId || idx} className="flex gap-4">
                        <div className="text-xs font-bold text-slate-400 w-10">
                          {d.getHours().toString().padStart(2, '0')}:{d.getMinutes().toString().padStart(2, '0')}
                        </div>
                        <div className="relative">
                          <div className="w-3 h-3 rounded-full bg-blue-500 z-10 relative"></div>
                          {idx < notifications.length - 1 && idx < 4 && <div className="absolute top-3 left-1.5 w-[1px] h-full bg-slate-200"></div>}
                        </div>
                        <div className="flex-1 text-xs">
                          <span className="font-bold text-slate-800">{n.message}</span>
                          <div className="text-slate-400 mt-1">{d.toLocaleDateString('vi-VN')}</div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-xs text-slate-500">Chưa có hoạt động nào</div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm text-slate-800">Khối lượng công việc</h4>
                  <div className="text-xs font-bold text-slate-600 flex items-center gap-1 cursor-pointer">
                    Dự án này <ChevronDown size={14} />
                  </div>
                </div>
                <div className="space-y-3">
                  {workloadArray.length > 0 ? workloadArray.map(w => (
                    <div key={w.ownerId} className="flex items-center gap-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                      <span className="font-bold text-slate-800 w-24 truncate" title={w.name}>{w.name}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{width: `${w.percentage}%`}}></div>
                      </div>
                      <span className="font-bold text-slate-600 w-8 text-right">{w.percentage}%</span>
                    </div>
                  )) : (
                    <div className="text-xs text-slate-500">Chưa có dữ liệu</div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right: Lists & Overviews */}
          <div className="col-span-4 flex flex-col gap-6">
            
            {/* Today's Tasks */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-sm text-slate-800">Việc hôm nay</h4>
                <a href="#" className="text-xs font-bold text-blue-600">Xem tất cả</a>
              </div>
              <div className="space-y-3">
                {tasks.slice(0, 5).map((t, idx) => {
                  const d = t.dueDate ? new Date(t.dueDate) : null;
                  return (
                    <div key={t.taskId || idx} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 cursor-pointer" 
                          checked={t.status === 'Done'}
                          onChange={() => toggleTaskStatus(t)}
                        />
                        <span className={`text-sm font-bold truncate w-32 transition-all ${t.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-800 group-hover:text-blue-600'}`} title={t.title}>{t.title}</span>
                      </div>
                      <div className={`text-[10px] font-bold px-2 py-1 rounded ${t.priority === 'High' ? 'bg-red-50 text-red-600' : t.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{t.priority}</div>
                      <div className="text-[10px] font-bold text-slate-500 w-10 text-right">{d ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` : 'N/A'}</div>
                    </div>
                  );
                })}
                {tasks.length === 0 && <div className="text-xs text-slate-500">Không có việc</div>}
              </div>
            </div>

            {/* Upcoming */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-sm text-slate-800">Sắp tới</h4>
                <a href="#" className="text-xs font-bold text-blue-600">Xem tất cả</a>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.status !== 'Done').slice(0, 4).map((t, idx) => {
                  const d = t.dueDate ? new Date(t.dueDate) : null;
                  return (
                    <div key={t.taskId || idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar size={14} className="text-blue-500" />
                        <span className="text-[10px] font-bold text-slate-500 w-12">{d ? `${d.getDate()}/${d.getMonth()+1}` : 'N/A'}</span>
                        <span className="text-sm font-bold text-slate-800 truncate w-32" title={t.title}>{t.title}</span>
                      </div>
                      <div className={`text-[10px] font-bold px-2 py-1 rounded ${t.priority === 'High' ? 'bg-red-50 text-red-600' : t.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {t.priority}
                      </div>
                    </div>
                  );
                })}
                {tasks.filter(t => t.status !== 'Done').length === 0 && <div className="text-xs text-slate-500">Không có việc sắp tới</div>}
              </div>
            </div>

            {/* Priority Overview */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <h4 className="font-bold text-sm text-slate-800 mb-4">Mức độ ưu tiên</h4>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold text-red-500 mb-1">Cao</p>
                  <p className="text-xl font-bold text-slate-800">{priorityData.high}</p>
                </div>
                <div className="flex-1 bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold text-amber-500 mb-1">TB</p>
                  <p className="text-xl font-bold text-slate-800">{priorityData.medium}</p>
                </div>
                <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold text-blue-500 mb-1">Thấp</p>
                  <p className="text-xl font-bold text-slate-800">{priorityData.low}</p>
                </div>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden mt-3">
                <div style={{width: `${totalTasks ? (priorityData.high/totalTasks)*100 : 0}%`}} className="bg-red-500 h-full transition-all duration-500"></div>
                <div style={{width: `${totalTasks ? (priorityData.medium/totalTasks)*100 : 0}%`}} className="bg-amber-500 h-full transition-all duration-500"></div>
                <div style={{width: `${totalTasks ? (priorityData.low/totalTasks)*100 : 0}%`}} className="bg-blue-500 h-full transition-all duration-500"></div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-2">Tổng cộng: {totalTasks} công việc</p>
            </div>

          </div>

        </div>
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
                <input 
                  type="text" 
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Nhập tên công việc..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả chi tiết</label>
                <textarea 
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Thêm mô tả (tùy chọn)"
                  rows={3}
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái</label>
                  <select 
                    value={newTask.status}
                    onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="To Do">Cần làm</option>
                    <option value="In Progress">Đang làm</option>
                    <option value="In Review">Chờ duyệt</option>
                    <option value="Done">Hoàn thành</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mức độ</label>
                  <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Low">Thấp</option>
                    <option value="Medium">Trung bình</option>
                    <option value="High">Cao</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hạn chót</label>
                <input 
                  type="date" 
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tạo công việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon Grid
function LayoutGrid(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>;
}
