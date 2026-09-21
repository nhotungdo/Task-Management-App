"use client";

import React, { useState, useEffect } from "react";
import { Plus, Target, CheckCircle2, TrendingUp, AlertCircle, Edit3, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/api";

interface KeyResult {
  keyResultId: string;
  title: string;
  targetValue: number;
  currentValue: number;
}

interface Goal {
  goalId: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: string;
  deadline?: string;
  ownerName?: string;
  keyResults: KeyResult[];
}

export default function GoalsManager({ workspaceId }: { workspaceId: string }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  // New goal modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", description: "", targetValue: 100, unit: "percent" });

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/Goals?workspaceId=${workspaceId}`);
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchGoals();
  }, [workspaceId]);

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return;
    try {
      await api.post("/Goals", { ...newGoal, workspaceId });
      setIsModalOpen(false);
      setNewGoal({ title: "", description: "", targetValue: 100, unit: "percent" });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mục tiêu này?")) return;
    try {
      await api.delete(`/Goals/${id}`);
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddKeyResult = async (goalId: string) => {
    const title = prompt("Tên Key Result:");
    if (!title) return;
    const target = prompt("Mục tiêu con số (ví dụ: 100):", "100");
    if (!target) return;
    
    try {
      await api.post(`/Goals/${goalId}/keyresults`, { title, targetValue: Number(target) });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateKeyResultProgress = async (goalId: string, krId: string, currentValue: number) => {
    try {
      await api.put(`/Goals/keyresults/${krId}`, { currentValue });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải OKRs...</div>;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Target className="text-indigo-600" size={20} /> Quản trị Mục tiêu & OKR
          </h3>
          <p className="text-xs text-slate-500 mt-1">Định hướng sự tập trung và đo lường kết quả của dự án</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary text-sm py-2 px-4 shadow-sm">
          <Plus size={16} /> Thêm Goal
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        {goals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <Target size={48} className="mx-auto text-slate-200 mb-4" />
            <h4 className="font-bold text-slate-600 text-lg">Chưa có mục tiêu nào</h4>
            <p className="text-slate-400 text-sm mt-1 mb-6">Tạo OKR đầu tiên để bắt đầu theo dõi tiến độ</p>
            <button onClick={() => setIsModalOpen(true)} className="btn-secondary text-sm">
              Tạo Goal mới
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const isExpanded = expandedGoalId === goal.goalId;
              const progressPercent = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
              
              return (
                <div key={goal.goalId} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all hover:border-indigo-200">
                  <div className="p-5 flex gap-4 items-start cursor-pointer" onClick={() => setExpandedGoalId(isExpanded ? null : goal.goalId)}>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                      <Target className="text-indigo-600" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-800 text-lg">{goal.title}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 flex items-center gap-1">
                            <CheckCircle2 size={12}/> {goal.status}
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.goalId); }} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                            <Trash2 size={16} />
                          </button>
                          {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mb-4">{goal.description || "Không có mô tả"}</p>
                      
                      {/* Main Goal Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-bold text-slate-700">Tiến độ chung</span>
                          <span className="font-bold text-indigo-600">{progressPercent}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Results Section */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-100 p-5 px-6 pb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                          <TrendingUp size={16} className="text-slate-400" />
                          Key Results (Kết quả then chốt)
                        </h5>
                        <button onClick={() => handleAddKeyResult(goal.goalId)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors">
                          <Plus size={14} /> Thêm KR
                        </button>
                      </div>

                      {goal.keyResults.length === 0 ? (
                        <p className="text-sm text-slate-400 italic bg-white p-4 rounded-lg border border-slate-100 text-center">Chưa có kết quả then chốt nào để đo lường.</p>
                      ) : (
                        <div className="space-y-3">
                          {goal.keyResults.map(kr => {
                            const krPercent = kr.targetValue > 0 ? Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100)) : 0;
                            return (
                              <div key={kr.keyResultId} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                <div className="flex-1">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-slate-800 text-sm">{kr.title}</span>
                                    <span className="text-xs font-bold text-slate-500">{kr.currentValue} / {kr.targetValue}</span>
                                  </div>
                                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${krPercent}%` }} />
                                  </div>
                                </div>
                                <div className="shrink-0 flex flex-col gap-1">
                                  <button onClick={() => handleUpdateKeyResultProgress(goal.goalId, kr.keyResultId, kr.currentValue + 1)} className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-indigo-100 hover:text-indigo-600" title="Cộng 1">
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">Tạo Mục tiêu mới</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Tên Mục tiêu (Objective)</label>
                <input type="text" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} className="input-field" placeholder="Ví dụ: Tăng doanh thu quý 3..." autoFocus />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Mô tả chi tiết</label>
                <textarea value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} className="input-field min-h-[80px]" placeholder="Chi tiết mục đích..." />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Giá trị đích</label>
                  <input type="number" value={newGoal.targetValue} onChange={e => setNewGoal({ ...newGoal, targetValue: Number(e.target.value) })} className="input-field" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Đơn vị</label>
                  <input type="text" value={newGoal.unit} onChange={e => setNewGoal({ ...newGoal, unit: e.target.value })} className="input-field" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary px-5">Hủy</button>
              <button onClick={handleCreateGoal} className="btn-primary px-5" disabled={!newGoal.title}>Tạo Mục tiêu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
