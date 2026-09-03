import React from "react";

// ========================================
// ICONS FOR LIFECYCLE STEPS
// ========================================

const StepIcon = ({ type, className = "h-5 w-5" }) => {
  switch (type) {
    case "submitted":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case "under_review":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <path d="m9 11 2 2 4-4" />
        </svg>
      );
    case "assigned":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      );
    case "in_progress":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "solved":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    default:
      return null;
  }
};

const STAGES = [
  { key: "submitted", label: "Submitted", desc: "Citizen report filed" },
  { key: "under_review", label: "Under Review", desc: "Government review & AI triage" },
  { key: "assigned", label: "Assigned", desc: "Allocated to University (HEI)" },
  { key: "in_progress", label: "In Progress", desc: "Industry R&D Collaboration" },
  { key: "solved", label: "Resolved", desc: "Solution deployed & verified" },
];

const STAGE_ORDER = {
  submitted: 0,
  under_review: 1,
  assigned: 2,
  in_progress: 3,
  solved: 4,
};

export default function LifecycleStepper({
  status = "submitted",
  assignedPartner = null,
  collaboratingPartner = null,
  createdAt = null,
  updatedAt = null,
  className = "",
}) {
  const currentIdx = STAGE_ORDER[status] ?? 0;

  const partnerName = typeof assignedPartner === "object" ? assignedPartner?.name : assignedPartner;
  const collabName = typeof collaboratingPartner === "object" ? collaboratingPartner?.name : collaboratingPartner;

  return (
    <section aria-label="Problem Lifecycle Progress" className={`rounded-2xl border border-[#e3e9e3] bg-gradient-to-b from-white to-[#fbfdfb] p-6 shadow-sm ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#eef2ee] pb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0b6b60]">
            Lifecycle Progression
          </span>
          <h3 className="text-base font-bold text-[#173d3a]">
            Crowdsourced Resolution Pipeline
          </h3>
        </div>

        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          status === "solved"
            ? "bg-[#d8ebe4] text-[#087f70]"
            : status === "in_progress"
            ? "bg-[#fef3c7] text-[#92400e]"
            : "bg-[#e2e8f0] text-[#475569]"
        }`}>
          <span className={`h-2 w-2 rounded-full ${
            status === "solved" ? "bg-[#087f70]" : "bg-amber-500 animate-pulse"
          }`} />
          Current Stage: {STAGES.find((s) => s.key === status)?.label || status}
        </span>
      </div>

      {/* STEPPER TRACK */}
      <div className="relative mt-6">
        <div className="hidden sm:block absolute left-6 right-6 top-6 h-1 bg-[#e3e9e3] -z-0">
          <div
            className="h-full bg-[#0b6b60] transition-all duration-700 ease-out"
            style={{ width: `${(currentIdx / (STAGES.length - 1)) * 100}%` }}
          />
        </div>

        <ol className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-5">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isPending = idx > currentIdx;

            return (
              <li key={stage.key} className="flex sm:flex-col sm:items-center text-left sm:text-center gap-3 sm:gap-2">
                {/* NODE ICON */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 transition-all duration-300 ${
                    isCompleted
                      ? "border-[#0b6b60] bg-[#0b6b60] text-white shadow-md shadow-[#0b6b60]/20"
                      : isCurrent
                      ? "border-[#0b6b60] bg-[#e9f4f0] text-[#0b6b60] shadow-md ring-4 ring-[#d8ebe4]"
                      : "border-[#e3e9e3] bg-white text-[#94a3b8]"
                  }`}
                >
                  {isCompleted ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <StepIcon type={stage.key} className="h-5 w-5" />
                  )}
                </div>

                {/* TEXT CONTENT */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold ${
                    isCurrent ? "text-[#0b6b60]" : isCompleted ? "text-[#173d3a]" : "text-[#94a3b8]"
                  }`}>
                    {stage.label}
                  </p>

                  <p className="mt-0.5 text-xs text-[#71827c] line-clamp-2">
                    {stage.key === "assigned" && partnerName ? (
                      <span className="font-semibold text-[#0b6b60]">{partnerName}</span>
                    ) : stage.key === "in_progress" && collabName ? (
                      <span className="font-semibold text-[#31527c]">+ {collabName}</span>
                    ) : (
                      stage.desc
                    )}
                  </p>

                  {isCompleted && stage.key === "submitted" && createdAt && (
                    <span className="mt-1 block text-[10px] text-[#8fa39c]">
                      {new Date(createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function MiniLifecycleBar({ status = "submitted", className = "" }) {
  const currentIdx = STAGE_ORDER[status] ?? 0;

  return (
    <div className={`flex items-center gap-1.5 ${className}`} title={`Stage: ${STAGES[currentIdx]?.label || status}`}>
      {STAGES.map((s, idx) => {
        const isDone = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={s.key} className="flex items-center gap-1">
            <span
              className={`h-2 rounded-full transition-all duration-300 ${
                isCurrent
                  ? "w-6 bg-[#0b6b60] ring-2 ring-[#d8ebe4]"
                  : isDone
                  ? "w-3 bg-[#0b6b60]"
                  : "w-2 bg-[#e2e8f0]"
              }`}
            />
            {idx < STAGES.length - 1 && (
              <span className={`h-0.5 w-1.5 ${idx < currentIdx ? "bg-[#0b6b60]" : "bg-[#e2e8f0]"}`} />
            )}
          </div>
        );
      })}
      <span className="ml-1 text-[11px] font-semibold text-[#0b6b60]">
        {STAGES[currentIdx]?.label || status}
      </span>
    </div>
  );
}

