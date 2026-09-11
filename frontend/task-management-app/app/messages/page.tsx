"use client";

import React, { useEffect, useState, useRef } from "react";
import { Send, Building, MessageCircle } from "lucide-react";
import api from "@/lib/api";
import * as signalR from "@microsoft/signalr";

interface Workspace {
  workspaceId: string;
  name: string;
}

interface Message {
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
}

export default function MessagesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWs, setActiveWs] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    api.get("/Auth/me").then(res => setMyUserId(res.data.userId)).catch(console.error);
    api.get("/Workspaces").then(res => {
      setWorkspaces(res.data);
      if (res.data.length > 0) setActiveWs(res.data[0].workspaceId);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const connectSignalR = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7070/hubs/chat", {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

      connection.on("ReceiveMessage", (message) => {
        setMessages(prev => {
          if (prev.find(m => m.messageId === message.messageId)) return prev;
          return [...prev, message];
        });
      });

      try {
        await connection.start();
        connectionRef.current = connection;
        
        if (activeWs) {
          await connection.invoke("JoinWorkspace", activeWs);
        }
      } catch (err) {
        console.error("SignalR Connection Error: ", err);
      }
    };

    connectSignalR();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [activeWs]);

  useEffect(() => {
    const fetchMessages = () => {
      if (!activeWs) return;
      api.get(`/workspaces/${activeWs}/chat`)
         .then(res => setMessages(res.data))
         .catch(console.error);
    };

    if (activeWs) {
      fetchMessages();
      
      if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
        connectionRef.current.invoke("JoinWorkspace", activeWs).catch(console.error);
      }
    }
  }, [activeWs]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeWs) return;
    try {
      await api.post("/chat", { workspaceId: activeWs, content: input });
      setInput("");
      // No need to call fetchMessages(), SignalR will push the new message
    } catch {
      console.error("Failed to send message");
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-white rounded-tl-[2rem] border-l border-t border-slate-100 shadow-sm">
      {/* Sidebar for chat contacts */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Tin nhắn</h2>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">Kênh dự án</p>
          {workspaces.map(ws => (
            <button 
              key={ws.workspaceId} 
              onClick={() => setActiveWs(ws.workspaceId)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeWs === ws.workspaceId ? 'bg-white shadow-sm border border-slate-100' : 'hover:bg-slate-100 border border-transparent'}`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Building size={18} />
              </div>
              <div className="text-left flex-1 truncate">
                <p className="font-bold text-sm text-slate-800 truncate">{ws.name}</p>
                <p className="text-xs text-slate-500 truncate">Kênh chat chung</p>
              </div>
            </button>
          ))}
          {workspaces.length === 0 && (
            <div className="text-xs text-slate-400 p-2">Tham gia dự án để chat</div>
          )}
        </div>
      </div>

      {/* Main chat window */}
      <div className="flex-1 flex flex-col">
        <header className="px-8 py-5 border-b border-slate-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <MessageCircle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{workspaces.find(w => w.workspaceId === activeWs)?.name || 'Đang tải...'}</h3>
            <p className="text-xs text-slate-500">Kênh chat dự án</p>
          </div>
        </header>

        <div className="flex-grow p-8 overflow-y-auto bg-slate-50 flex flex-col gap-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="m-auto text-slate-400 text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">Chưa có tin nhắn nào. Hãy là người đầu tiên!</div>
          ) : (
            messages.map(m => {
              const isMe = m.senderId === myUserId;
              return (
                <div key={m.messageId} className={`flex max-w-[70%] ${isMe ? 'ml-auto flex-row-reverse' : ''} gap-3`}>
                  <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 mt-1 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm border border-white">
                    {m.senderName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-slate-400 font-bold mb-1 mx-1">{m.senderName || 'Người dùng'}</span>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'}`}>
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <form onSubmit={handleSend} className="flex gap-4">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..." 
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
            <button type="submit" disabled={!input.trim()} className="px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
