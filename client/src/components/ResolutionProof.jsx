import React from "react";
import JharkhandEmblem from "./JharkhandEmblem";

export default function ResolutionProof({
  problem,
  project = null,
  className = "",
}) {
  if (!problem || problem.status !== "solved") return null;

  const universityName =
    project?.partner?.name ||
    problem.resolutionDetails?.leadPartner ||
    (typeof problem.assignedPartner === "object"
      ? problem.assignedPartner?.name
      : problem.assignedPartner) ||
    "Higher Education Institution";

  const industryCollaborators =
    (project?.collaborators || [])
      .filter((c) => c.status === "accepted")
      .map((c) => c.partner?.name)
      .filter(Boolean);

  const industryName =
    industryCollaborators.length > 0
      ? industryCollaborators.join(", ")
      : problem.resolutionDetails?.collaborators?.length > 0
        ? problem.resolutionDetails.collaborators.join(", ")
        : "Industry & CSR Partner";

  return (
    <section
      aria-label="Official Resolution Certification"
      className={`relative overflow-hidden rounded-2xl border-2 border-[#0b6b60]/20 bg-gradient-to-br from-[#f2f8f5] via-white to-[#f7fbf9] p-6 shadow-md sm:p-8 ${className}`}
    >
      {/* BACKGROUND WATERMARK */}
      <div className="pointer-events-none absolute -right-8 -top-8 opacity-5">
        <JharkhandEmblem className="h-64 w-64" />
      </div>

      {/* HEADER */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#d8ebe4] pb-5">
        <div className="flex items-center gap-3">
          <JharkhandEmblem className="h-12 w-12 shrink-0 drop-shadow-sm" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0b6b60]">
              Official Government Proof of Resolution
            </span>
            <h3 className="text-xl font-bold text-[#173d3a]">
              Challenge Successfully Solved
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-[#0b6b60] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Field Verified & Completed
        </div>
      </div>

      {/* BEFORE & AFTER SHOWCASE */}
      <div className="relative z-10 mt-6 grid gap-6 md:grid-cols-2">
        {/* BEFORE CARD */}
        <div className="rounded-xl border border-red-100 bg-red-50/40 p-5">
          <div className="flex items-center justify-between border-b border-red-100 pb-2.5">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              Before — Citizen Challenge
            </span>
            <span className="text-xs font-medium text-red-600">
              Grievance Reported
            </span>
          </div>

          <h4 className="mt-3 text-base font-bold text-[#173d3a]">
            {problem.title}
          </h4>

          <p className="mt-2 text-xs leading-relaxed text-[#5c6f69]">
            {problem.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#71827c]">
            <span className="rounded-md bg-white px-2 py-1 border border-red-100 font-medium text-red-800">
              📍 {problem.location}
            </span>
            <span className="rounded-md bg-white px-2 py-1 border border-red-100 font-medium capitalize text-red-800">
              🏷️ Category: {problem.category}
            </span>
          </div>
        </div>

        {/* AFTER CARD */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0b6b60]">
              <span className="h-2 w-2 rounded-full bg-[#0b6b60]" />
              After — Collaborative Resolution
            </span>
            <span className="text-xs font-semibold text-[#0b6b60]">
              ✓ Deployed & Operational
            </span>
          </div>

          <h4 className="mt-3 text-base font-bold text-[#173d3a]">
            {project?.title || "Field-Tested Prototype & Community Deployment"}
          </h4>

          <div className="mt-3 space-y-2 text-xs text-[#2c4740]">
            <div className="flex items-start gap-2">
              <span className="font-bold text-[#0b6b60]">Academic Lead:</span>
              <span>{universityName}</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-bold text-[#31527c]">Industry CSR:</span>
              <span>{industryName}</span>
            </div>

            {project?.outcomes && (
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-emerald-200/80 pt-2.5 text-center">
                <div className="rounded-lg bg-white p-1.5 border border-emerald-100">
                  <p className="text-base font-extrabold text-[#0b6b60]">
                    {project.outcomes.deployments || 1}
                  </p>
                  <p className="text-[10px] text-[#5c6f69]">Deployments</p>
                </div>
                <div className="rounded-lg bg-white p-1.5 border border-emerald-100">
                  <p className="text-base font-extrabold text-[#0b6b60]">
                    {project.outcomes.patents || 0}
                  </p>
                  <p className="text-[10px] text-[#5c6f69]">Patents</p>
                </div>
                <div className="rounded-lg bg-white p-1.5 border border-emerald-100">
                  <p className="text-base font-extrabold text-[#0b6b60]">
                    {project.outcomes.publications || 1}
                  </p>
                  <p className="text-[10px] text-[#5c6f69]">Publications</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VERIFICATION SIGN-OFF */}
      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#d8ebe4] pt-4 text-xs text-[#5c6f69]">
        <p>
          Verified under the <strong>Government of Jharkhand SIH Problem-Solving Framework</strong>.
        </p>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#0b514a] bg-white px-3 py-1.5 text-xs font-semibold text-[#0b514a] transition hover:bg-[#e9f4f0]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Resolution Certificate
        </button>
      </div>
    </section>
  );
}
