/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import { 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay, 
  isToday,
  parseISO
} from "date-fns";

export default function CalendarPage() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWsId, setSelectedWsId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Quick Add Task State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState<Date | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  
  // Task Detail Popover State
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  useEffect(() => {
    api.get("/Workspaces").then(res => {
      setWorkspaces(res.data);
      if (res.data && res.data.length > 0) {
        setSelectedWsId(res.data[0].workspaceId);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedWsId) {
      fetchTasks(selectedWsId);
    }
  }, [selectedWsId, currentDate]); // Refetch if month changes (optional, but good for scale)

  const fetchTasks = async (wsId: string) => {
    try {
      // In a real app, pass startDate and endDate of the calendar view to filter tasks.
      // For now, we fetch a large page size to cover the view.
      const res = await api.get(`/Tasks?workspaceId=${wsId}&pageSize=500`);
      setTasks(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToday = () => setCurrentDate(new Date());

  const handleDayClick = (date: Date) => {
    setSelectedDateForAdd(date);
    setNewTaskTitle("");
    setIsAddModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWsId || !selectedDateForAdd || !newTaskTitle.trim()) return;

    try {
      await api.post("/Tasks", {
        workspaceId: selectedWsId,
        title: newTaskTitle,
        dueDate: selectedDateForAdd.toISOString(),
        status: "To Do",
        priority: "Normal"
      });
      setIsAddModalOpen(false);
      fetchTasks(selectedWsId);
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const handleTaskClick = (e: React.MouseEvent, task: any) => {
    e.stopPropagation();
    setSelectedTask(task);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.patch(`/Tasks/${taskId}`, { status: newStatus });
      setSelectedTask((prev: any) => ({ ...prev, status: newStatus }));
      setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // Calendar Grid Calculation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday as first day
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getStatusColor = (status: string, dueDate: string) => {
    if (status === "Done") return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
    if (status === "In Progress") return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
    
    // Check if overdue
    if (dueDate && new Date(dueDate) < new Date() && status !== "Done") {
      return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
    }
    return "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-tl-[2rem] border-l border-t border-slate-100 shadow-sm relative">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0 bg-white z-10">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Lịch Công Việc</h2>
            <p className="text-sm text-slate-500 font-medium">Theo dõi deadline trực quan</p>
          </div>
          <div className="h-10 w-px bg-slate-200 mx-2"></div>
          <select 
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            value={selectedWsId || ""}
            onChange={e => setSelectedWsId(e.target.value)}
          >
            {workspaces.map(ws => (
              <option key={ws.workspaceId} value={ws.workspaceId}>{ws.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={goToday} className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
            Hôm nay
          </button>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
            <button onClick={prevMonth} className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"><ChevronLeft size={18} /></button>
            <span className="font-bold text-slate-800 w-36 text-center text-sm capitalize">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <button onClick={nextMonth} className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="flex-grow flex flex-col p-8 overflow-y-auto bg-slate-50/50 custom-scrollbar relative">
        <div className="flex-grow flex flex-col border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white min-h-[600px]">
          {/* Days of week header */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center shrink-0">
            {['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map(d => (
              <div key={d} className="py-3 font-bold text-slate-500 text-xs uppercase tracking-wider border-r border-slate-200 last:border-0">{d}</div>
            ))}
          </div>
          
          {/* Calendar Cells */}
          <div className="grid grid-cols-7 flex-grow auto-rows-fr">
            {calendarDays.map((day, i) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayTasks = tasks.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), day));
              
              return (
                <div 
                  key={day.toISOString()} 
                  onClick={() => handleDayClick(day)}
                  className={`
                    border-r border-b border-slate-200 p-2 relative group cursor-pointer transition-colors
                    ${isCurrentMonth ? 'bg-white hover:bg-blue-50/30' : 'bg-slate-50/80 text-slate-400'}
                    ${isToday(day) ? 'bg-blue-50/10' : ''}
                    last:border-r-0
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`
                      text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday(day) ? 'bg-blue-600 text-white shadow-sm' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    
                    {/* Add button appears on hover */}
                    <div className="opacity-0 group-hover:opacity-100 p-1 bg-white border border-slate-200 rounded text-slate-400 hover:text-blue-600 hover:border-blue-300 shadow-sm transition-all">
                      <Plus size={12} strokeWidth={3} />
                    </div>
                  </div>

                  <div className="space-y-1.5 overflow-y-auto max-h-[100px] custom-scrollbar absolute left-2 right-2">
                    {dayTasks.map(t => (
                      <div 
                        key={t.taskId} 
                        onClick={(e) => handleTaskClick(e, t)}
                        className={`
                          text-[10px] font-bold px-2 py-1.5 rounded-md truncate border shadow-sm transition-transform hover:scale-[1.02]
                          ${getStatusColor(t.status, t.dueDate)}
                        `} 
                        title={t.title}
                      >
                        {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {isAddModalOpen && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Plus size={18} className="text-blue-600" />
                Thêm Công Việc Nhanh
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6">
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Tên công việc</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="Nhập tên công việc..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
              <div className="mb-6 flex items-center gap-3 text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <CalendarIcon size={16} className="text-blue-500" />
                Đáo hạn: <span className="font-bold text-slate-800">{selectedDateForAdd ? format(selectedDateForAdd, 'dd/MM/yyyy') : ''}</span>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={!newTaskTitle.trim()} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-600/20 transition-all">
                  Tạo Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedTask(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <h3 className="font-bold text-lg text-slate-800 mb-1">{selectedTask.title}</h3>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Clock size={14} />
                  Hạn chót: {selectedTask.dueDate ? format(parseISO(selectedTask.dueDate), 'dd/MM/yyyy HH:mm') : 'Không có'}
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors shrink-0 ml-4">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6">
              {selectedTask.description && (
                <div className="mb-6">
                  <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">{selectedTask.description}</p>
                </div>
              )}
              
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Cập nhật nhanh trạng thái</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => updateTaskStatus(selectedTask.taskId, "To Do")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selectedTask.status === "To Do" ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'}`}
                  >
                    <AlertCircle size={18} className="mb-1.5" />
                    <span className="text-xs font-bold">To Do</span>
                  </button>
                  <button 
                    onClick={() => updateTaskStatus(selectedTask.taskId, "In Progress")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selectedTask.status === "In Progress" ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50'}`}
                  >
                    <Clock size={18} className="mb-1.5" />
                    <span className="text-xs font-bold">In Progress</span>
                  </button>
                  <button 
                    onClick={() => updateTaskStatus(selectedTask.taskId, "Done")}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selectedTask.status === "Done" ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20' : 'bg-white text-emerald-600 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'}`}
                  >
                    <CheckCircle2 size={18} className="mb-1.5" />
                    <span className="text-xs font-bold">Done</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <a href={`/tasks`} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                Xem toàn bộ chi tiết 
                <ChevronRight size={16} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
