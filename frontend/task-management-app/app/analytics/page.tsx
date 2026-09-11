/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { BarChart2, TrendingUp, Users } from "lucide-react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { 
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend 
} from "chart.js";
import api from "@/lib/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

export default function AnalyticsPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  
  useEffect(() => {
    // Aggregating all tasks from the first workspace
    api.get("/Workspaces").then(async res => {
      if (res.data && res.data.length > 0) {
        const wsId = res.data[0].workspaceId;
        const taskRes = await api.get(`/Tasks?workspaceId=${wsId}`);
        setTasks(taskRes.data.items || []);
      }
    }).catch(console.error);
  }, []);

  const statuses = {
    'To Do': tasks.filter(t => t.status === 'To Do').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    'In Review': tasks.filter(t => t.status === 'In Review').length,
    'Done': tasks.filter(t => t.status === 'Done').length,
  };

  const donutData = {
    labels: ['To Do', 'In Progress', 'In Review', 'Done'],
    datasets: [{
      data: [statuses['To Do'], statuses['In Progress'], statuses['In Review'], statuses['Done']],
      backgroundColor: ['#e2e8f0', '#f59e0b', '#8b5cf6', '#10b981'],
      borderWidth: 0,
    }]
  };

  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Hoàn thành',
      data: [2, 5, 3, 8, 4, 1, 0], // dummy trend visualization
      backgroundColor: '#3b82f6',
      borderRadius: 4
    }]
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-tl-[2rem] border-l border-t border-slate-100 shadow-sm">
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Phân tích & Báo cáo</h2>
          <p className="text-sm text-slate-500 font-medium">Theo dõi hiệu suất và tiến độ DoneIt</p>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <BarChart2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Tổng công việc</p>
                <h3 className="text-2xl font-bold text-slate-800">{tasks.length}</h3>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Tỉ lệ hoàn thành</p>
                <h3 className="text-2xl font-bold text-slate-800">{tasks.length ? Math.round((statuses['Done']/tasks.length)*100) : 0}%</h3>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500">Năng suất nhóm</p>
                <h3 className="text-2xl font-bold text-slate-800">+12%</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Trạng thái công việc</h3>
            <div className="h-64 relative flex justify-center">
              {tasks.length > 0 ? <Doughnut data={donutData} options={{ maintainAspectRatio: false }} /> : <p className="text-slate-400 mt-20">Không có dữ liệu</p>}
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Xu hướng hoàn thành (Tuần)</h3>
            <div className="h-64 relative">
              <Bar data={barData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
