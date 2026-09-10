"use client";

import React, { useEffect, useState } from "react";
import { 
  Search, Filter, Plus, Bell, MessageSquare, Settings, 
  MoreVertical, Calendar, Clock, BarChart3, ChevronDown, CheckCircle2
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
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const wsRes = await api.get("/Workspaces");
        if (wsRes.data && wsRes.data.length > 0) {
          setWorkspaces(wsRes.data);
          setActiveWorkspaceId(wsRes.data[0].workspaceId);
        }
      } catch (err) {
        console.error("Failed to load workspaces", err);
      }
    };
    fetchInitData();
  }, []);

  useEffect(() => {
    if (activeWorkspaceId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      api.get(`/Tasks?workspaceId=${activeWorkspaceId}`)
        .then(res => {
          setTasks(res.data.items || []);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [activeWorkspaceId]);

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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-tl-[2rem] border-l border-t border-slate-100 shadow-sm">
      
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Công việc</h2>
          <p className="text-sm text-slate-500 font-medium">Quản lý và theo dõi công việc nhóm</p>
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
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-semibold hover:bg-slate-50">
            <Filter size={16} /> Lọc
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700">
            <Plus size={16} /> Thêm công việc
          </button>
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
            <Bell size={20} className="text-slate-500 hover:text-slate-800 cursor-pointer" />
            <MessageSquare size={20} className="text-slate-500 hover:text-slate-800 cursor-pointer" />
            <Settings size={20} className="text-slate-500 hover:text-slate-800 cursor-pointer" />
            <div className="w-8 h-8 bg-blue-100 rounded-full ml-2"></div>
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
              <p className="text-xs font-bold text-green-500 mt-2">↑ 8 tuần này</p>
            </div>
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Calendar size={28} />
            </div>
          </div>
          
          <div className="col-span-3 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">Đang thực hiện</p>
              <h3 className="text-3xl font-bold text-slate-800">{inProgressCount}</h3>
              <p className="text-xs font-bold text-amber-500 mt-2">↓ đến hạn hôm nay</p>
            </div>
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
              <BarChart3 size={28} />
            </div>
          </div>

          <div className="col-span-3 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">Đã hoàn thành</p>
              <h3 className="text-3xl font-bold text-slate-800">{completedTasks}</h3>
              <p className="text-xs font-bold text-green-500 mt-2">↑ 12 tuần này</p>
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

            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {/* Cần làm */}
              <div className="min-w-[220px] flex-1">
                <div className="flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-lg font-bold text-sm mb-4">
                  <span>Cần làm</span>
                  <span className="bg-white px-2 rounded text-xs">{todoTasks.length}</span>
                </div>
                <div className="space-y-4">
                  {todoTasks.map(task => (
                    <div key={task.taskId} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                          <h4 className="font-bold text-sm text-slate-800 truncate" title={task.title}>{task.title}</h4>
                        </div>
                        <MoreVertical size={16} className="text-slate-400 shrink-0 cursor-pointer" />
                      </div>
                      <div className="inline-block bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded mb-4">Design</div>
                      <div className="flex justify-between items-center text-xs text-slate-400 font-medium border-t border-slate-50 pt-3">
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không có hạn'}</span>
                        <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-2 flex items-center justify-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 rounded-lg">
                    <Plus size={16} /> Thêm việc
                  </button>
                </div>
              </div>

              {/* Đang làm */}
              <div className="min-w-[220px] flex-1">
                <div className="flex items-center justify-between bg-amber-50 text-amber-700 px-3 py-2 rounded-lg font-bold text-sm mb-4">
                  <span>Đang làm</span>
                  <span className="bg-white px-2 rounded text-xs">{inProgressTasks.length}</span>
                </div>
                <div className="space-y-4">
                  {inProgressTasks.map(task => (
                    <div key={task.taskId} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                          <h4 className="font-bold text-sm text-slate-800 truncate">{task.title}</h4>
                        </div>
                        <MoreVertical size={16} className="text-slate-400 shrink-0" />
                      </div>
                      <div className="inline-block bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded mb-4">Development</div>
                      <div className="flex justify-between items-center text-xs text-slate-400 font-medium border-t border-slate-50 pt-3">
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không có hạn'}</span>
                        <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-2 flex items-center justify-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 rounded-lg">
                    <Plus size={16} /> Thêm việc
                  </button>
                </div>
              </div>

              {/* Đang duyệt */}
              <div className="min-w-[220px] flex-1">
                <div className="flex items-center justify-between bg-purple-50 text-purple-700 px-3 py-2 rounded-lg font-bold text-sm mb-4">
                  <span>Chờ duyệt</span>
                  <span className="bg-white px-2 rounded text-xs">{inReviewTasks.length}</span>
                </div>
                <div className="space-y-4">
                  {inReviewTasks.map(task => (
                    <div key={task.taskId} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                          <h4 className="font-bold text-sm text-slate-800 truncate">{task.title}</h4>
                        </div>
                        <MoreVertical size={16} className="text-slate-400 shrink-0" />
                      </div>
                      <div className="inline-block bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-1 rounded mb-4">Review</div>
                      <div className="flex justify-between items-center text-xs text-slate-400 font-medium border-t border-slate-50 pt-3">
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không có hạn'}</span>
                        <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-2 flex items-center justify-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 rounded-lg">
                    <Plus size={16} /> Thêm việc
                  </button>
                </div>
              </div>

              {/* Hoàn thành */}
              <div className="min-w-[220px] flex-1">
                <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-2 rounded-lg font-bold text-sm mb-4">
                  <span>Hoàn thành</span>
                  <span className="bg-white px-2 rounded text-xs">{doneTasks.length}</span>
                </div>
                <div className="space-y-4">
                  {doneTasks.map(task => (
                    <div key={task.taskId} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                          <h4 className="font-bold text-sm text-slate-800 truncate line-through opacity-70">{task.title}</h4>
                        </div>
                        <MoreVertical size={16} className="text-slate-400 shrink-0" />
                      </div>
                      <div className="inline-block bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded mb-4">Hoàn tất</div>
                      <div className="flex justify-between items-center text-xs text-slate-400 font-medium border-t border-slate-50 pt-3">
                        <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : 'Không có hạn'}</span>
                        <CheckCircle2 size={20} className="text-green-500" />
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-2 flex items-center justify-center gap-2 text-blue-600 font-bold text-sm hover:bg-blue-50 rounded-lg">
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
                  <div className="flex gap-4">
                    <div className="text-xs font-bold text-slate-400 w-10">09:20</div>
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-blue-500 z-10 relative"></div>
                      <div className="absolute top-3 left-1.5 w-[1px] h-full bg-slate-200"></div>
                    </div>
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-slate-800">Nho Tùng</span> đã kéo công việc <span className="font-bold">&quot;Thiết kế UI&quot;</span> sang Đang làm
                      <div className="text-slate-400 mt-1">2 phút trước</div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-xs font-bold text-slate-400 w-10">10:15</div>
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-green-500 z-10 relative"></div>
                    </div>
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-slate-800">Thanh Xuân</span> đã hoàn thành <span className="font-bold">&quot;Wireframe&quot;</span>
                      <div className="text-slate-400 mt-1">15 phút trước</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm text-slate-800">Khối lượng công việc</h4>
                  <div className="text-xs font-bold text-slate-600 flex items-center gap-1 cursor-pointer">
                    Tuần này <ChevronDown size={14} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                    <span className="font-bold text-slate-800 w-24">Nho Tùng</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-[80%] rounded-full"></div>
                    </div>
                    <span className="font-bold text-slate-600 w-8 text-right">80%</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                    <span className="font-bold text-slate-800 w-24">Thanh Xuân</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-[65%] rounded-full"></div>
                    </div>
                    <span className="font-bold text-slate-600 w-8 text-right">65%</span>
                  </div>
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
                {tasks.slice(0, 4).map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300" defaultChecked={t.status === 'Done'} />
                      <span className={`text-sm font-bold truncate w-32 ${t.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.title}</span>
                    </div>
                    <div className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">Dev</div>
                    <div className="text-[10px] font-bold text-slate-500">09:00 AM</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-sm text-slate-800">Sắp tới</h4>
                <a href="#" className="text-xs font-bold text-blue-600">Xem tất cả</a>
              </div>
              <div className="space-y-3">
                {tasks.slice(4, 7).map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar size={14} className="text-blue-500" />
                      <span className="text-[10px] font-bold text-slate-500 w-12">Aug 14</span>
                      <span className="text-sm font-bold text-slate-800 truncate w-32">{t.title}</span>
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded ${t.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {t.priority}
                    </div>
                  </div>
                ))}
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
                <div style={{width: `${(priorityData.high/totalTasks)*100}%`}} className="bg-red-500 h-full"></div>
                <div style={{width: `${(priorityData.medium/totalTasks)*100}%`}} className="bg-amber-500 h-full"></div>
                <div style={{width: `${(priorityData.low/totalTasks)*100}%`}} className="bg-blue-500 h-full"></div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-2">Tổng cộng: {totalTasks} công việc</p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

// Just add this simple icon since we didn't import LayoutGrid at the top
function LayoutGrid(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>;
}
