"use client";

import React, { useEffect, useState, useRef } from "react";
import { Search, Loader2, FileText, MessageSquare, AlertCircle, Calendar, Folder, X, User } from "lucide-react";
import api from "@/lib/api";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: string;
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  timestamp: string;
}

export default function GlobalSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // eslint-disable-next-line
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsLoading(false);
      }
    }, 400); // debounce

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (item: SearchResult) => {
    onClose();
    if (item.type === "Task" || item.type === "Comment") {
      // Assuming tasks are in workspace
      router.push(`/workspaces/${item.workspaceId}?tab=board`);
      // It might be better to open the task detail drawer if we had global state, but for now we navigate to the workspace
    } else if (item.type === "Message") {
      router.push(`/messages`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 pb-20 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-base text-slate-800 placeholder:text-slate-400"
            placeholder="Tìm kiếm công việc, bình luận, tin nhắn..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {isLoading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin mr-2" />}
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2" style={{ scrollbarWidth: "thin" }}>
          {!query.trim() && (
            <div className="py-12 text-center">
              <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">Gõ gì đó để bắt đầu tìm kiếm...</p>
            </div>
          )}

          {query.trim() && !isLoading && results.length === 0 && (
            <div className="py-12 text-center">
              <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 mb-1">Không tìm thấy kết quả nào</p>
              <p className="text-xs text-slate-500">Thử tìm kiếm với từ khóa khác</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kết quả tìm kiếm ({results.length})</p>
              {results.map((item, idx) => (
                <button
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-start text-left p-3 rounded-xl hover:bg-indigo-50 transition-colors group"
                >
                  <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-3 shadow-sm
                    ${item.type === 'Task' ? 'bg-blue-100 text-blue-600' : 
                      item.type === 'Comment' ? 'bg-amber-100 text-amber-600' : 
                      'bg-emerald-100 text-emerald-600'}`}
                  >
                    {item.type === 'Task' ? <FileText size={16} /> :
                     item.type === 'Comment' ? <MessageSquare size={16} /> : <User size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600 transition-colors">
                        {item.type}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(item.timestamp), "HH:mm dd/MM")}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 truncate mb-0.5 group-hover:text-indigo-700">{item.title}</h4>
                    {item.content && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.content}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
