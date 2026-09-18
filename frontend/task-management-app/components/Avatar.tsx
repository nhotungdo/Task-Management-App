import React from "react";

export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const colors = ["bg-indigo-100 text-indigo-700", "bg-fuchsia-100 text-fuchsia-700", "bg-emerald-100 text-emerald-700", "bg-orange-100 text-orange-700"];
  const idx = name.charCodeAt(0) % colors.length;
  const sizeClass = size === "lg" ? "w-10 h-10 text-sm" : size === "md" ? "w-8 h-8 text-xs" : "w-6 h-6 text-xs";
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold ${colors[idx]}`} title={name}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
