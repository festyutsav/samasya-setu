import React from "react";

const CATEGORY_MAP = {
  agriculture: {
    label: "Agriculture",
    icon: "🌾",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  },
  water: {
    label: "Water Resources",
    icon: "💧",
    className: "bg-sky-50 text-sky-700 border-sky-200/70",
  },
  healthcare: {
    label: "Healthcare",
    icon: "🏥",
    className: "bg-rose-50 text-rose-700 border-rose-200/70",
  },
  education: {
    label: "Education",
    icon: "🎓",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
  },
  environment: {
    label: "Environment",
    icon: "🌿",
    className: "bg-teal-50 text-teal-700 border-teal-200/70",
  },
  transportation: {
    label: "Transportation",
    icon: "🛣️",
    className: "bg-slate-50 text-slate-700 border-slate-200/70",
  },
  energy: {
    label: "Energy & Power",
    icon: "⚡",
    className: "bg-amber-50 text-amber-700 border-amber-200/70",
  },
  waste: {
    label: "Waste Management",
    icon: "♻️",
    className: "bg-orange-50 text-orange-700 border-orange-200/70",
  },
  public_safety: {
    label: "Public Safety",
    icon: "🛡️",
    className: "bg-blue-50 text-blue-700 border-blue-200/70",
  },
  technology: {
    label: "Technology",
    icon: "💻",
    className: "bg-cyan-50 text-cyan-700 border-cyan-200/70",
  },
  other: {
    label: "General Community",
    icon: "✦",
    className: "bg-gray-50 text-gray-700 border-gray-200/70",
  },
};

export default function CategoryBadge({ category, className = "" }) {
  const normalized = (category || "").toLowerCase().replace(/[\s-]+/g, "_");
  const config = CATEGORY_MAP[normalized] || {
    label: category ? category.charAt(0).toUpperCase() + category.slice(1) : "General",
    icon: "✦",
    className: "bg-gray-50 text-gray-700 border-gray-200/70",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold tracking-wide shadow-2xs ${config.className} ${className}`}
    >
      <span className="text-[11px]" aria-hidden="true">
        {config.icon}
      </span>
      <span>{config.label}</span>
    </span>
  );
}
