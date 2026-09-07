import React from "react";

const STATUS_MAP = {
  submitted: {
    label: "Submitted",
    dotClass: "bg-sky-500",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200/80",
    pulse: false,
  },
  under_review: {
    label: "Under Review",
    dotClass: "bg-purple-500",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200/80",
    pulse: true,
  },
  assigned: {
    label: "Assigned",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80",
    pulse: false,
  },
  in_progress: {
    label: "In Progress",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    pulse: true,
  },
  solved: {
    label: "Resolved",
    dotClass: "bg-[#087f70]",
    badgeClass: "bg-[#e1f1ed] text-[#087f70] border-[#b4dfd7]",
    pulse: false,
    icon: "✓",
  },
  planning: {
    label: "Planning",
    dotClass: "bg-amber-500",
    badgeClass: "bg-[#fdf6ec] text-[#92400e] border-amber-200",
    pulse: false,
  },
  active: {
    label: "Active Collaboration",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-[#e8f5f1] text-[#065f54] border-[#a5dcd0]",
    pulse: true,
  },
  completed: {
    label: "Project Completed",
    dotClass: "bg-[#087f70]",
    badgeClass: "bg-[#e1f1ed] text-[#087f70] border-[#a1d6cb]",
    pulse: false,
    icon: "✓",
  },
};

export default function StatusBadge({ status, className = "" }) {
  const normalized = (status || "").toLowerCase().replace(/[\s-]+/g, "_");
  const config = STATUS_MAP[normalized] || {
    label: (status || "Unknown").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    dotClass: "bg-gray-400",
    badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
    pulse: false,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-2xs ${config.badgeClass} ${className}`}
    >
      {config.icon ? (
        <span className="text-[11px] font-bold" aria-hidden="true">
          {config.icon}
        </span>
      ) : (
        <span className="relative flex h-2 w-2">
          {config.pulse && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.dotClass}`}
            />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${config.dotClass}`}
          />
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
}
