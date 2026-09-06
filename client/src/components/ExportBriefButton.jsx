import React from "react";

export default function ExportBriefButton({
  label = "Export Executive Brief (PDF)",
  className = "",
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={`no-print inline-flex items-center gap-2 rounded-xl border border-[#0b514a] bg-white px-4 py-2 text-sm font-semibold text-[#0b514a] shadow-sm transition hover:bg-[#e9f4f0] active:scale-[0.98] ${className}`}
      title="Print or save as PDF"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 text-[#0b514a]"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
