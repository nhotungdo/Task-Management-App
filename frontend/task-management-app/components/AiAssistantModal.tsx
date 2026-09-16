/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback } from "react";
import { Sparkles, X, Send, Bot, ArrowRight, Loader2 } from "lucide-react";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: { label: string; action: string }[];
}

const API_URL = "/api/ai-assistant";

export default function AiAssistantModal({ isOpen, onClose }: AiAssistantModalProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Xin chào! Mình là **Trợ lý Năng suất AI**. Mình có thể hỗ trợ tóm tắt công việc hôm nay, phân tích mức độ ưu tiên hoặc tối ưu kế hoạch làm việc cho bạn.",
      actions: [
        { label: "📋 Tóm tắt việc hôm nay", action: "summary" },
        { label: "⚡ Việc nào cần ưu tiên gấp?", action: "priority" },
        { label: "📅 Lập lịch trình làm việc tập trung", action: "plan" },
      ],
    },
  ]);

  const callApi = useCallback(async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error:", response.status, errorData);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content ?? "Xin lỗi, mình không nhận được phản hồi từ mô hình AI.";
    } catch (err) {
      console.error("API call failed:", err);
      return "⚠️ Đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.";
    }
  }, []);

  const handleSend = async (text?: string) => {
    const query = text || input;
    if (!query.trim() || loading) return;

    const newMsgs: Message[] = [...messages, { role: "user", content: query }];
    setMessages(newMsgs);
    if (!text) setInput("");
    setLoading(true);

    const reply = await callApi(query);

    setMessages([...newMsgs, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white border border-slate-200/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm">Trợ lý Năng suất AI</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Thử nghiệm</span>
              </div>
              <p className="text-xs text-slate-500">Tối ưu hiệu suất & lập kế hoạch thông minh</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot size={16} />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm rounded-br-none"
                  : "bg-white border border-slate-200/80 text-slate-700 shadow-sm rounded-bl-none"
              }`}>
                <div className="whitespace-pre-line">{m.content}</div>
                {m.actions && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                    {m.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleSend(act.action)}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 text-slate-600 transition-colors flex items-center gap-1.5"
                      >
                        {act.label} <ArrowRight size={11} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center text-xs text-slate-400">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <span className="animate-pulse font-medium">Trợ lý AI đang phân tích dữ liệu công việc...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3.5 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nhập câu hỏi hoặc yêu cầu tóm tắt cho Trợ lý AI..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white disabled:opacity-40 hover:opacity-95 transition-opacity shadow-sm flex items-center justify-center"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
