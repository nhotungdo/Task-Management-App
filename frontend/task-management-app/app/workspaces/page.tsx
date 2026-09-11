/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { FolderKanban, Plus, MoreVertical, Calendar, Sparkles, Loader2, X, Search, ChevronRight, Users, BarChart2, Clock } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface Workspace {
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: string;
}

const WS_COLORS = [
  "linear-gradient(135deg, #0052cc, #0073e6)",
  "linear-gradient(135deg, #7c3aed, #9f4af7)",
  "linear-gradient(135deg, #059669, #10b981)",
  "linear-gradient(135deg, #dc2626, #ef4444)",
  "linear-gradient(135deg, #d97706, #f59e0b)",
  "linear-gradient(135deg, #0891b2, #06b6d4)",
];

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Workspaces");
      setWorkspaces(res.data);
    } catch {
      console.error("Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkspaces(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/Workspaces", { name: newName, description: newDesc });
      setNewName(""); setNewDesc(""); setIsCreating(false);
      await loadWorkspaces();
    } catch { console.error("Failed to create workspace"); }
    finally { setSubmitting(false); }
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiProgress(0);
    const interval = setInterval(() => setAiProgress(p => p < 90 ? p + 12 : p), 400);
    setTimeout(async () => {
      clearInterval(interval);
      setAiProgress(100);
      try {
        const wsRes = await api.post("/Workspaces", {
          name: aiPrompt.slice(0, 40),
          description: "Sinh tự động bởi AI: " + aiPrompt
        });
        const newWsId = wsRes.data.workspaceId || wsRes.data.id;
        const mockTasks = [
          { title: "Nghiên cứu và phân tích yêu cầu", status: "Done", priority: "High", progress: 100 },
          { title: "Thiết kế kiến trúc hệ thống", status: "In Progress", priority: "High", progress: 60 },
          { title: "Phát triển các tính năng cốt lõi", status: "To Do", priority: "Medium", progress: 0 },
          { title: "Kiểm thử và đảm bảo chất lượng", status: "To Do", priority: "High", progress: 0 },
          { title: "Triển khai và bàn giao", status: "To Do", priority: "Low", progress: 0 },
        ];
        for (const t of mockTasks) {
          try { await api.post("/Tasks", { ...t, workspaceId: newWsId }); } catch { /* ignore */ }
        }
        setIsAiModalOpen(false); setAiPrompt("");
        await loadWorkspaces();
      } catch { console.error("AI Generation failed"); }
      finally { setIsGenerating(false); }
    }, 3200);
  };

  const filtered = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(search.toLowerCase()) ||
    (ws.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "var(--content-bg)" }}>

      {/* ── Page Header ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid var(--border)", padding: "0 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FolderKanban size={18} color="var(--blue)" />
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Tất cả dự án</h1>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", background: "#f1f5f9", padding: "2px 8px", borderRadius: 10, marginLeft: 4 }}>
              {workspaces.length}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm dự án..."
                className="gp-input"
                style={{ paddingLeft: 28, width: 200 }}
              />
            </div>
            <button onClick={() => setIsAiModalOpen(true)} className="btn-secondary"
              style={{ background: "linear-gradient(135deg, #f5f0ff, #ede9ff)", borderColor: "#c4b5fd", color: "#7c3aed" }}>
              <Sparkles size={14} />
              AI Tạo dự án
            </button>
            <button onClick={() => setIsCreating(true)} className="btn-primary">
              <Plus size={14} />
              Dự án mới
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

        {/* Create Form */}
        {isCreating && (
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "var(--shadow-md)", padding: 20, marginBottom: 20, maxWidth: 520 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Tạo dự án mới</h3>
              <button onClick={() => setIsCreating(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 0 }}><X size={16}/></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Tên dự án *</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="gp-input"
                  placeholder="Nhập tên dự án..." autoFocus required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Mô tả</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="gp-input"
                  placeholder="Mô tả ngắn gọn về dự án..." rows={2}
                  style={{ resize: "none" as const }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="submit" disabled={submitting || !newName.trim()} className="btn-primary">
                  {submitting ? "Đang tạo..." : "Tạo dự án"}
                </button>
                <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary">Hủy</button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 size={24} color="var(--blue)" style={{ animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <FolderKanban size={28} color="var(--text-tertiary)" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
              {search ? "Không tìm thấy dự án" : "Chưa có dự án nào"}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
              {search ? "Thử tìm với từ khóa khác" : "Tạo dự án đầu tiên để bắt đầu quản lý công việc"}
            </p>
            {!search && (
              <button onClick={() => setIsCreating(true)} className="btn-primary">
                <Plus size={14} /> Tạo dự án mới
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filtered.map((ws, idx) => (
              <div key={ws.workspaceId} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", boxShadow: "var(--shadow-sm)", transition: "box-shadow 0.15s, border-color 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"; (e.currentTarget as HTMLElement).style.borderColor = "#0052cc40"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                
                {/* Color bar */}
                <div style={{ height: 4, background: WS_COLORS[idx % WS_COLORS.length] }} />
                
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: WS_COLORS[idx % WS_COLORS.length], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                          {ws.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }} title={ws.name}>
                          {ws.name}
                        </h4>
                        <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={10} />
                          {new Date(ws.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4, borderRadius: 4 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <MoreVertical size={15} />
                    </button>
                  </div>

                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 14, minHeight: 32, lineHeight: 1.5,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" as const }}>
                    {ws.description || "Không có mô tả"}
                  </p>

                  {/* Stats row */}
                  <div style={{ display: "flex", gap: 16, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border-light)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
                      <Users size={12} /> <span>—</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
                      <BarChart2 size={12} /> <span>—</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
                      <Clock size={12} /> <span>—</span>
                    </div>
                  </div>

                  <Link href={`/workspaces/${ws.workspaceId}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "var(--blue)", textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--blue-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--blue)")}>
                    Mở dự án <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── AI Modal ── */}
      {isAiModalOpen && (
        <div className="gp-overlay" onClick={() => !isGenerating && setIsAiModalOpen(false)}>
          <div className="gp-modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #7c3aed, #9f4af7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={16} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Tạo dự án bằng AI</h3>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>Mô tả ý tưởng, AI sẽ lập kế hoạch</p>
                </div>
              </div>
              {!isGenerating && (
                <button onClick={() => setIsAiModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}><X size={16} /></button>
              )}
            </div>
            <div style={{ padding: 20 }}>
              {!isGenerating ? (
                <form onSubmit={handleAiGenerate}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Mô tả dự án của bạn</label>
                    <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="gp-input"
                      placeholder="VD: Chiến dịch marketing ra mắt sản phẩm mới, thời gian 1 tháng, đội 5 người..."
                      rows={4} style={{ resize: "none" as const }} autoFocus />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => setIsAiModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Hủy</button>
                    <button type="submit" disabled={!aiPrompt.trim()}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 14px", background: "linear-gradient(135deg, #7c3aed, #0052cc)", color: "#fff", border: "none", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: aiPrompt.trim() ? "pointer" : "not-allowed", opacity: aiPrompt.trim() ? 1 : 0.5 }}>
                      <Sparkles size={14} /> Bắt đầu tạo
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ padding: "20px 0", textAlign: "center" }}>
                  <Loader2 size={36} color="#7c3aed" style={{ animation: "spin 0.8s linear infinite", marginBottom: 12 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>AI đang lập kế hoạch...</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>Đang phân tích và tạo cấu trúc công việc</p>
                  <div style={{ height: 6, background: "#e8edf3", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg, #7c3aed, #0052cc)", borderRadius: 3, transition: "width 0.3s ease", width: `${aiProgress}%` }} />
                  </div>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
