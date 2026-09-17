/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from "react";
import { FileText, Upload, Download, Trash2, X } from "lucide-react";
import api from "@/lib/api";

interface Attachment {
  taskAttachmentId: string;
  fileName: string;
  fileUrl: string;
  contentType?: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

interface AttachmentsManagerProps {
  taskId: string;
  attachments: Attachment[];
  onUpdate: () => void;
}

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  "application/pdf": <span className="text-red-500">📄</span>,
  "image/png": <span>🖼️</span>,
  "image/jpeg": <span>🖼️</span>,
  "image/gif": <span>🖼️</span>,
  "text/plain": <span className="text-blue-500">📝</span>,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": <span className="text-blue-600">📎</span>,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": <span className="text-green-600">📊</span>,
  "application/zip": <span>🗜️</span>,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ contentType }: { contentType?: string }) {
  const lower = (contentType || "").toLowerCase();
  for (const [key, icon] of Object.entries(FILE_TYPE_ICONS)) {
    if (lower.includes(key.replace("application/", "").replace("image/", ""))) {
      return icon;
    }
    if (key === lower) return icon;
  }
  return <FileText size={16} className="text-slate-400" />;
}

export default function AttachmentsManager({ taskId, attachments: initialAttachments, onUpdate }: AttachmentsManagerProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setAttachments(initialAttachments);
  }, [initialAttachments]);

  const refresh = async () => {
    try {
      const res = await api.get(`/Tasks/${taskId}/attachments`);
      setAttachments(res.data || []);
      onUpdate();
    } catch {
      console.error("Failed to load attachments");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/Tasks/${taskId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      e.target.value = "";
      await refresh();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Không thể tải lên tệp.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Xóa tệp đính kèm này?")) return;
    try {
      await api.delete(`/Tasks/${taskId}/attachments/${attachmentId}`);
      await refresh();
    } catch {
      console.error("Failed to delete attachment");
    }
  };

  return (
    <div className="border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
          <FileText size={14} className="text-indigo-500" />
          Tệp đính kèm ({attachments.length})
        </label>
        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
          <Upload size={12} />
          Tải lên
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {uploadError && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <X size={12} />
          {uploadError}
        </div>
      )}

      {uploading && (
        <div className="mb-2 text-xs text-slate-500">Đang tải lên...</div>
      )}

      {attachments.length === 0 ? (
        <div className="text-center py-6 text-slate-300 border border-dashed border-slate-200 rounded-xl">
          <Upload size={20} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Chưa có tệp đính kèm nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map(att => (
            <div key={att.taskAttachmentId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileIcon contentType={att.contentType} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{att.fileName}</p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(att.fileSizeBytes)} · {new Date(att.uploadedAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                  title="Tải xuống"
                >
                  <Download size={13} />
                </a>
                <button
                  onClick={() => handleDelete(att.taskAttachmentId)}
                  className="p-1.5 text-slate-500 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Xóa"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
