export const STATUS_COLORS: Record<string, string> = {
  "To Do": "bg-slate-100 text-slate-500",
  "In Progress": "bg-amber-50 text-amber-700",
  "In Review": "bg-purple-50 text-purple-700",
  "Done": "bg-emerald-50 text-emerald-700",
};

export const STATUS_LABELS: Record<string, string> = {
  "To Do": "Cần làm",
  "In Progress": "Đang làm",
  "In Review": "Chờ duyệt",
  "Done": "Hoàn thành",
};

export const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-blue-50 text-blue-600 border-blue-100",
  Normal: "bg-slate-50 text-slate-500 border-slate-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  High: "bg-red-50 text-red-600 border-red-100",
};

export const PRIORITY_LABELS: Record<string, string> = {
  Low: "Thấp",
  Normal: "Bình thường",
  Medium: "Trung bình",
  High: "Cao",
};

export const PRIORITY_DOTS: Record<string, string> = {
  Low: "bg-blue-400",
  Normal: "bg-slate-400",
  Medium: "bg-amber-400",
  High: "bg-red-500",
};

export const PRIORITY_ICONS: Record<string, string> = {
  Low: "▼",
  Normal: "●",
  Medium: "▲",
  High: "🔴",
};
