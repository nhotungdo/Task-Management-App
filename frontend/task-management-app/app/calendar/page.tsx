/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";

export default function CalendarPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const currentDate = new Date();
  
  useEffect(() => {
    api.get("/Workspaces").then(async res => {
      if (res.data && res.data.length > 0) {
        const taskRes = await api.get(`/Tasks?workspaceId=${res.data[0].workspaceId}`);
        setTasks(taskRes.data.items || []);
      }
    }).catch(console.error);
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-tl-[2rem] border-l border-t border-slate-100 shadow-sm">
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lịch DoneIt</h2>
          <p className="text-sm text-slate-500 font-medium">Theo dõi deadline và sự kiện</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"><ChevronLeft size={20} /></button>
          <span className="font-bold text-slate-800 w-32 text-center">Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}</span>
          <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"><ChevronRight size={20} /></button>
        </div>
      </header>

      <div className="flex-grow p-8 overflow-y-auto">
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
              <div key={d} className="py-3 font-bold text-slate-500 text-sm border-r border-slate-200 last:border-0">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[120px]">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="border-r border-b border-slate-200 bg-slate-50/50 p-2"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = i + 1;
              const dayTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).getDate() === date && new Date(t.dueDate).getMonth() === currentDate.getMonth());
              return (
                <div key={date} className="border-r border-b border-slate-200 p-2 hover:bg-slate-50 transition-colors relative group">
                  <span className="text-sm font-bold text-slate-600 block mb-1">{date}</span>
                  <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {dayTasks.map(t => (
                      <div key={t.taskId} className="text-[10px] font-bold bg-blue-50 text-blue-700 p-1.5 rounded truncate" title={t.title}>
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
    </div>
  );
}
