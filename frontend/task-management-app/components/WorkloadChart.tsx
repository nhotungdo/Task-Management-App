"use client";

import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Users, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import api from "@/lib/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface WorkloadData {
  userId: string;
  name: string;
  email: string;
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  estimatedHours: number;
}

export default function WorkloadChart({ workspaceId }: { workspaceId: string }) {
  const [data, setData] = useState<WorkloadData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkload = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/Workspaces/${workspaceId}/workload`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkload();
  }, [workspaceId]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        stacked: true,
      },
      x: {
        stacked: true,
      },
    },
  };

  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        label: 'Hoàn thành',
        data: data.map(d => d.doneTasks),
        backgroundColor: '#10b981', // emerald-500
      },
      {
        label: 'Đang làm',
        data: data.map(d => d.inProgressTasks),
        backgroundColor: '#f59e0b', // amber-500
      },
      {
        label: 'Còn lại (To Do)',
        data: data.map(d => d.totalTasks - d.doneTasks - d.inProgressTasks),
        backgroundColor: '#cbd5e1', // slate-300
      }
    ],
  };

  const hoursData = {
    labels: data.map(d => d.name),
    datasets: [
      {
        label: 'Ước tính giờ làm (h)',
        data: data.map(d => d.estimatedHours),
        backgroundColor: '#6366f1', // indigo-500
        borderRadius: 4,
      }
    ]
  };

  const hoursOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: { y: { beginAtZero: true } },
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải biểu đồ...</div>;

  return (
    <div className="bg-slate-50 h-full p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-indigo-600" />
            Khối lượng công việc (Workload)
          </h2>
          <p className="text-sm text-slate-500 mt-1">Theo dõi số lượng công việc và số giờ phân bổ cho từng thành viên</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng Task</p>
              <p className="text-lg font-black text-slate-700 leading-none">{data.reduce((sum, d) => sum + d.totalTasks, 0)}</p>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng Giờ</p>
              <p className="text-lg font-black text-slate-700 leading-none">{data.reduce((sum, d) => sum + d.estimatedHours, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-slate-400" />
            Trạng thái Task theo thành viên
          </h3>
          <div className="flex-1 min-h-0">
            <Bar options={chartOptions} data={chartData} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-slate-400" />
            Ước tính thời gian (Giờ)
          </h3>
          <div className="flex-1 min-h-0">
            <Bar options={hoursOptions} data={hoursData} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Thành viên</th>
              <th className="px-6 py-3 text-center">Tổng Task</th>
              <th className="px-6 py-3 text-center">Đang làm</th>
              <th className="px-6 py-3 text-center">Hoàn thành</th>
              <th className="px-6 py-3 text-right">Tỷ lệ hoàn thành</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map(row => {
              const completionRate = row.totalTasks > 0 ? Math.round((row.doneTasks / row.totalTasks) * 100) : 0;
              return (
                <tr key={row.userId || 'unassigned'} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                        {row.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">{row.name}</p>
                        <p className="text-xs text-slate-400">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-slate-700">{row.totalTasks}</td>
                  <td className="px-6 py-4 text-center text-amber-600 font-semibold">{row.inProgressTasks}</td>
                  <td className="px-6 py-4 text-center text-emerald-600 font-semibold">{row.doneTasks}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${completionRate}%` }} />
                      </div>
                      <span className="text-xs font-bold w-8 text-right">{completionRate}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
