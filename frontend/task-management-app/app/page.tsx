/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, Filter, Plus, Bell, MessageSquare, Settings, 
  MoreVertical, Calendar, Clock, BarChart3, ChevronDown, CheckCircle2, X
} from "lucide-react";
import { isToday, isAfter, startOfDay } from "date-fns";
import { Doughnut } from "react-chartjs-2";
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
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", status: "To Do", priority: "Medium", dueDate: "", ownerId: "", workspaceId: "" });

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
        if (notifData) setNotifications(notifData);
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

  const handleDragStart = (e: React.DragEvent, taskId: string) => e.dataTransfer.setData("taskId", taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
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
      console.error("Failed to update status");
      fetchTasks();
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "Done" ? "To Do" : "Done";
    setTasks(prev => prev.map(t => t.taskId === task.taskId ? { ...t, status: newStatus } : t));
    try {
      await api.put(`/Tasks/${task.taskId}`, { ...task, status: newStatus });
    } catch (error) {
      fetchTasks();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetWorkspace = newTask.workspaceId || activeWorkspaceId;
    if (!targetWorkspace || !newTask.title.trim()) return;
    try {
      await api.post("/Tasks", {
        title: newTask.title,
        description: newTask.description,
        workspaceId: targetWorkspace,
        status: newTask.status,
        priority: newTask.priority,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
        ownerId: newTask.ownerId || null
      });
      setIsModalOpen(false);
      setNewTask({ title: "", description: "", status: "To Do", priority: "Medium", dueDate: "", ownerId: "", workspaceId: "" });
      fetchTasks();
    } catch (err) {
      console.error("Failed to create task");
    }
  };

  const openModalForStatus = (status: string) => {
    setNewTask(prev => ({ ...prev, status }));
    setIsModalOpen(true);
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const todoTasks = filteredTasks.filter(t => t.status === "To Do");
  const inProgressTasks = filteredTasks.filter(t => t.status === "In Progress");
  const inReviewTasks = filteredTasks.filter(t => t.status === "In Review");
  const doneTasks = filteredTasks.filter(t => t.status === "Done");

  const totalTasks = filteredTasks.length;
  const completedTasks = doneTasks.length;
  const inProgressCount = inProgressTasks.length;

  const donutData = {
    labels: ['Completed', 'In Progress', 'To Do'],
    datasets: [{
      data: totalTasks === 0 ? [0,0,100] : [completedTasks, inProgressCount, totalTasks - completedTasks - inProgressCount],
      backgroundColor: ['#10b981', '#f59e0b', '#e2e8f0'],
      borderWidth: 0,
      cutout: '75%',
    }]
  };

  const priorityData = {
    high: filteredTasks.filter(t => t.priority === "High").length,
    medium: filteredTasks.filter(t => t.priority === "Medium").length,
    low: filteredTasks.filter(t => t.priority === "Low").length,
  };

  const workloadMap: Record<string, number> = {};
  filteredTasks.forEach(t => {
    if (t.ownerId) workloadMap[t.ownerId] = (workloadMap[t.ownerId] || 0) + 1;
  });
  const workloadArray = Object.entries(workloadMap).map(([id, count]) => ({
    ownerId: id,
    name: usersMap[id] || 'Người dùng ẩn',
    count,
    percentage: totalTasks ? Math.round((count / totalTasks) * 100) : 0
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  const prioColor = (p: string) => p === 'High' ? 'var(--priority-high)' : p === 'Medium' ? 'var(--priority-medium)' : 'var(--priority-low)';

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--content-bg)", position: "relative" }}>
      
      {/* ── Top Header ── */}
      <header style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Tổng quan</h2>
            {workspaces.length > 0 && (
              <select className="gp-select" value={activeWorkspaceId || ""} onChange={(e) => setActiveWorkspaceId(e.target.value)} style={{ padding: "4px 24px 4px 10px", fontSize: 13, background: "#f8f9fb" }}>
                {workspaces.map(ws => (
                  <option key={ws.workspaceId} value={ws.workspaceId}>{ws.name}</option>
                ))}
              </select>
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>Quản lý và theo dõi công việc nhóm</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm kiếm công việc..." className="gp-input" style={{ paddingLeft: 30, width: 260, borderRadius: 20 }} />
          </div>
          <button className="btn-secondary" style={{ borderRadius: 20 }}><Filter size={14} /> Lọc</button>
          <button onClick={() => openModalForStatus("To Do")} className="btn-primary" style={{ borderRadius: 20 }}><Plus size={14} /> Thêm việc</button>
        </div>
      </header>

      {/* ── Scrollable Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        
        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 24 }}>
          <div className="gp-card" style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 6px" }}>Tổng số công việc</p>
              <h3 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{totalTasks}</h3>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: "var(--blue-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={24} color="var(--blue)" />
            </div>
          </div>
          
          <div className="gp-card" style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 6px" }}>Đang thực hiện</p>
              <h3 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{inProgressCount}</h3>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: "#fff8e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart3 size={24} color="#d97706" />
            </div>
          </div>

          <div className="gp-card" style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 6px" }}>Đã hoàn thành</p>
              <h3 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{completedTasks}</h3>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: "#e6faf3", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={24} color="#059669" />
            </div>
          </div>

          <div className="gp-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 64, height: 64, position: "relative" }}>
              <Doughnut data={donutData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>Tiến độ chung</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 11, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 4 }}>
                <li style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }}/> Hoàn thành</span>
                  <span style={{ fontWeight: 600 }}>{totalTasks ? Math.round((completedTasks/totalTasks)*100) : 0}%</span>
                </li>
                <li style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }}/> Đang làm</span>
                  <span style={{ fontWeight: 600 }}>{totalTasks ? Math.round((inProgressCount/totalTasks)*100) : 0}%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          
          {/* ── Left: Kanban Board ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Bảng công việc</h3>
              <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }}>Sắp xếp: Mức độ</button>
            </div>

            <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12 }}>
              
              {[ 
                { id: "To Do", label: "Cần làm", tasks: todoTasks, bg: "var(--surface-raised)", color: "var(--text-secondary)" },
                { id: "In Progress", label: "Đang làm", tasks: inProgressTasks, bg: "#fff8e6", color: "#d97706" },
                { id: "In Review", label: "Chờ duyệt", tasks: inReviewTasks, bg: "#f3f0ff", color: "#7c3aed" },
                { id: "Done", label: "Hoàn thành", tasks: doneTasks, bg: "#e6faf3", color: "#059669" }
              ].map(col => (
                <div key={col.id} style={{ minWidth: 240, flex: 1, display: "flex", flexDirection: "column" }}
                  onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
                  
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: col.bg, color: col.color, padding: "8px 12px", borderRadius: 4, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                    <span>{col.label}</span>
                    <span style={{ background: "#fff", padding: "2px 6px", borderRadius: 10, fontSize: 10, color: "var(--text-primary)" }}>{col.tasks.length}</span>
                  </div>

                  <div style={{ flex: 1, background: "rgba(0,0,0,0.02)", borderRadius: 6, padding: 8, minHeight: 200, display: "flex", flexDirection: "column", gap: 8 }}>
                    {col.tasks.map(task => (
                      <div key={task.taskId} draggable onDragStart={(e) => handleDragStart(e, task.taskId)}
                        className="gp-card" style={{ padding: 12, cursor: "grab", background: "#fff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: prioColor(task.priority) }} />
                            <h4 style={{ fontSize: 13, fontWeight: 600, color: task.status === "Done" ? "var(--text-tertiary)" : "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160, textDecoration: task.status === "Done" ? "line-through" : "none" }} title={task.title}>{task.title}</h4>
                          </div>
                        </div>
                        <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, marginBottom: 12, background: "var(--border-light)", color: prioColor(task.priority) }}>{task.priority}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-light)", paddingTop: 8 }}>
                          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "Không có hạn"}
                          </span>
                          {task.status === "Done" ? (
                            <CheckCircle2 size={16} color="#059669" />
                          ) : (
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--blue-light)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }} title={task.ownerId ? usersMap[task.ownerId] : ""}>
                              {task.ownerId ? (usersMap[task.ownerId]?.charAt(0).toUpperCase() || "U") : "?"}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => openModalForStatus(col.id)} style={{ width: "100%", padding: 8, background: "none", border: "1px dashed var(--border)", borderRadius: 4, color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--text-secondary)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                      <Plus size={14} /> Thêm việc
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Left: Timeline & Workload */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 16 }}>
              <div className="gp-card" style={{ padding: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, margin: 0 }}>Dòng thời gian</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {notifications.length > 0 ? notifications.slice(0, 4).map((n, idx) => {
                    const d = new Date(n.createdAt);
                    return (
                      <div key={n.notificationId || idx} style={{ display: "flex", gap: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", width: 36 }}>{d.getHours().toString().padStart(2, '0')}:{d.getMinutes().toString().padStart(2, '0')}</div>
                        <div style={{ position: "relative" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--blue)", position: "relative", zIndex: 2, top: 4 }} />
                          {idx < notifications.length - 1 && idx < 3 && <div style={{ position: "absolute", top: 8, left: 3.5, width: 1, height: "100%", background: "var(--border)" }} />}
                        </div>
                        <div style={{ flex: 1, fontSize: 12 }}>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{n.message}</span>
                          <div style={{ color: "var(--text-tertiary)", marginTop: 2 }}>{d.toLocaleDateString('vi-VN')}</div>
                        </div>
                      </div>
                    );
                  }) : <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Chưa có hoạt động nào</div>}
                </div>
              </div>

              <div className="gp-card" style={{ padding: 20 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, margin: 0 }}>Khối lượng công việc</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {workloadArray.length > 0 ? workloadArray.map(w => (
                    <div key={w.ownerId} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--blue-light)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10 }}>{w.name.charAt(0).toUpperCase()}</div>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", width: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={w.name}>{w.name}</span>
                      <div style={{ flex: 1, height: 6, background: "var(--border-light)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: "var(--blue)", width: `${w.percentage}%` }} />
                      </div>
                      <span style={{ fontWeight: 700, color: "var(--text-secondary)", width: 32, textAlign: "right" }}>{w.percentage}%</span>
                    </div>
                  )) : <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Chưa có dữ liệu</div>}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Lists & Overviews ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            <div className="gp-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Việc hôm nay</h4>
                <Link href="/tasks" style={{ fontSize: 12, fontWeight: 600, color: "var(--blue)", textDecoration: "none" }}>Xem tất cả</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredTasks.filter(t => t.dueDate && isToday(new Date(t.dueDate))).slice(0, 5).map((t, idx) => {
                  const d = t.dueDate ? new Date(t.dueDate) : null;
                  return (
                    <div key={t.taskId || idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <input type="checkbox" checked={t.status === 'Done'} onChange={() => toggleTaskStatus(t)} style={{ cursor: "pointer" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: t.status === 'Done' ? "var(--text-tertiary)" : "var(--text-primary)", textDecoration: t.status === 'Done' ? "line-through" : "none", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.title}>{t.title}</span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)" }}>{d ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` : ''}</div>
                    </div>
                  );
                })}
                {filteredTasks.filter(t => t.dueDate && isToday(new Date(t.dueDate))).length === 0 && <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Không có việc hôm nay</div>}
              </div>
            </div>

            <div className="gp-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Sắp tới</h4>
                <Link href="/calendar" style={{ fontSize: 12, fontWeight: 600, color: "var(--blue)", textDecoration: "none" }}>Xem tất cả</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredTasks.filter(t => t.status !== 'Done' && t.dueDate && isAfter(new Date(t.dueDate), startOfDay(new Date())) && !isToday(new Date(t.dueDate))).slice(0, 4).map((t, idx) => {
                  const d = t.dueDate ? new Date(t.dueDate) : null;
                  return (
                    <div key={t.taskId || idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Calendar size={14} color="var(--blue)" />
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", width: 40 }}>{d ? `${d.getDate()}/${d.getMonth()+1}` : ''}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.title}>{t.title}</span>
                      </div>
                    </div>
                  );
                })}
                {filteredTasks.filter(t => t.status !== 'Done' && t.dueDate && isAfter(new Date(t.dueDate), startOfDay(new Date())) && !isToday(new Date(t.dueDate))).length === 0 && <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Không có việc sắp tới</div>}
              </div>
            </div>

            <div className="gp-card" style={{ padding: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 16px" }}>Mức độ ưu tiên</h4>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, background: "#fff1f0", borderRadius: 6, padding: 12, textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--priority-high)", margin: "0 0 4px" }}>Cao</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{priorityData.high}</p>
                </div>
                <div style={{ flex: 1, background: "#fff8e6", borderRadius: 6, padding: 12, textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--priority-medium)", margin: "0 0 4px" }}>TB</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{priorityData.medium}</p>
                </div>
                <div style={{ flex: 1, background: "var(--blue-light)", borderRadius: 6, padding: 12, textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--blue)", margin: "0 0 4px" }}>Thấp</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{priorityData.low}</p>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 3, display: "flex", overflow: "hidden", background: "var(--border-light)" }}>
                <div style={{ width: `${totalTasks ? (priorityData.high/totalTasks)*100 : 0}%`, background: "var(--priority-high)" }} />
                <div style={{ width: `${totalTasks ? (priorityData.medium/totalTasks)*100 : 0}%`, background: "var(--priority-medium)" }} />
                <div style={{ width: `${totalTasks ? (priorityData.low/totalTasks)*100 : 0}%`, background: "var(--blue)" }} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      {isModalOpen && (
        <div className="gp-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="gp-modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Thêm công việc mới</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateTask} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Tên công việc <span style={{ color: "var(--priority-high)" }}>*</span></label>
                <input type="text" required value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} className="gp-input" placeholder="Nhập tên công việc..." autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Mô tả</label>
                <textarea value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} className="gp-input" placeholder="Mô tả công việc (tùy chọn)" rows={3} style={{ resize: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Trạng thái</label>
                  <select value={newTask.status} onChange={(e) => setNewTask({...newTask, status: e.target.value})} className="gp-select" style={{ width: "100%" }}>
                    <option value="To Do">Cần làm</option>
                    <option value="In Progress">Đang làm</option>
                    <option value="In Review">Chờ duyệt</option>
                    <option value="Done">Hoàn thành</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Mức độ</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})} className="gp-select" style={{ width: "100%" }}>
                    <option value="Low">Thấp</option>
                    <option value="Medium">Trung bình</option>
                    <option value="High">Cao</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Dự án (DoneIt)</label>
                  <select value={newTask.workspaceId || activeWorkspaceId || ""} onChange={(e) => setNewTask({...newTask, workspaceId: e.target.value})} className="gp-select" style={{ width: "100%" }}>
                    {workspaces.map(ws => <option key={ws.workspaceId} value={ws.workspaceId}>{ws.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Người nhận</label>
                  <select value={newTask.ownerId} onChange={(e) => setNewTask({...newTask, ownerId: e.target.value})} className="gp-select" style={{ width: "100%" }}>
                    <option value="">Chưa giao</option>
                    {Object.entries(usersMap).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Hạn chót</label>
                <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} className="gp-input" />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: "center" }}>Tạo công việc</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
