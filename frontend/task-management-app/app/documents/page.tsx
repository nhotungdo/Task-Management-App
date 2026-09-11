"use client";

import React from "react";
import { Hammer } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white rounded-tl-[2rem] border-l border-t border-slate-100 shadow-sm">
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tài liệu</h2>
          <p className="text-sm text-slate-500 font-medium">Quản lý các tệp đính kèm và tài nguyên DoneIt</p>
        </div>
      </header>

      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-slate-50">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6 shadow-inner">
          <Hammer size={48} />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Tính năng đang được phát triển!</h3>
        <p className="text-slate-500 max-w-md">
          Tính năng lưu trữ và quản lý Tài liệu hiện đang được đội ngũ kỹ sư xây dựng. Hãy quay lại sau nhé!
        </p>
      </div>
    </div>
  );
}
