import React, { useState } from "react";
import JharkhandEmblem from "./JharkhandEmblem";
import ResolutionCertificateModal from "./ResolutionCertificateModal";

export default function ResolutionProof({
  problem,
  project = null,
  className = "",
}) {
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

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

      {/* CITIZEN VERIFICATION & AUDIT PROOF */}
      {problem.citizenFeedback?.isVerified ? (
        <div className="relative z-10 mt-6 rounded-xl border border-emerald-300 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">✓</span>
              Citizen Ground Verification & Satisfaction Audit
            </span>
            <span className="text-[11px] text-slate-500">
              Verified {problem.citizenFeedback.verifiedAt ? new Date(problem.citizenFeedback.verifiedAt).toLocaleDateString() : "Recently"}
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 ${
                    s <= (problem.citizenFeedback.rating || 5)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-none stroke-slate-300 text-slate-300"
                  }`}
                  strokeWidth="1.5"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
              <span className="ml-1 text-xs font-bold text-slate-700">
                {problem.citizenFeedback.rating || 5} / 5 Stars
              </span>
            </div>

            {problem.citizenFeedback.isSatisfied && (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                Ground Reality Confirmed Fixed
              </span>
            )}
          </div>

          {problem.citizenFeedback.comments && (
            <p className="mt-2 text-xs italic text-slate-600 bg-slate-50 rounded-lg p-2 border border-slate-100">
              "{problem.citizenFeedback.comments}"
            </p>
          )}
        </div>
      ) : (
        <div className="relative z-10 mt-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-800">
          <span className="flex items-center gap-2">
            <span className="animate-pulse">⏳</span>
            <span>Awaiting Citizen Ground Verification & Satisfaction Rating</span>
          </span>
          <span className="text-[11px] font-medium text-amber-700">Pending Citizen Review</span>
        </div>
      )}

      {/* VERIFICATION SIGN-OFF */}
      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#d8ebe4] pt-4 text-xs text-[#5c6f69]">
        <p>
          Verified under the <strong>Government of Jharkhand SIH Problem-Solving Framework</strong>.
        </p>

        <button
          type="button"
          onClick={() => setIsCertModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#0b514a] bg-white px-3 py-1.5 text-xs font-semibold text-[#0b514a] shadow-2xs transition hover:bg-[#e9f4f0]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Official Resolution & CSR Certificate
        </button>
      </div>

      <ResolutionCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        problem={problem}
        project={project}
      />
    </section>
  );
}
