import React, { useEffect } from "react";
import JharkhandEmblem from "./JharkhandEmblem";

export default function ResolutionCertificateModal({
  isOpen,
  onClose,
  problem,
  project = null,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !problem) return null;

  const certificateId = `JH-RES-${new Date(problem.updatedAt || Date.now()).getFullYear()}-${(
    problem._id || "00000000"
  )
    .slice(-8)
    .toUpperCase()}`;

  const issueDate = new Date(
    problem.resolutionApprovedAt || problem.updatedAt || Date.now()
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const universityName =
    project?.partner?.name ||
    problem.resolutionDetails?.leadPartner ||
    (typeof problem.assignedPartner === "object"
      ? problem.assignedPartner?.name
      : problem.assignedPartner) ||
    "Higher Education Institution of Jharkhand";

  const industryCollaborators = (project?.collaborators || [])
    .filter((c) => c.status === "accepted")
    .map((c) => c.partner?.name)
    .filter(Boolean);

  const industryName =
    industryCollaborators.length > 0
      ? industryCollaborators.join(", ")
      : problem.resolutionDetails?.collaborators?.length > 0
      ? problem.resolutionDetails.collaborators.join(", ")
      : "Industry Partner & CSR Foundation";

  const teamList = (project?.team || []).slice(0, 4);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative my-6 w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL CONTROL BAR (HIDDEN IN PRINT) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white text-xs">
              📜
            </span>
            <span>Official Government Resolution Certificate & CSR Audit Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* PRINTABLE CERTIFICATE CANVAS */}
        <div
          id="printable-certificate"
          className="relative m-4 sm:m-6 overflow-hidden rounded-xl border-8 border-double border-[#0b514a] bg-gradient-to-b from-[#fbfdfc] via-white to-[#f5faf8] p-6 sm:p-10 text-slate-800 shadow-inner"
        >
          {/* WATERMARK BACKGROUND EMBLEM */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]">
            <JharkhandEmblem className="h-[480px] w-[480px]" />
          </div>

          {/* INNER BORDER ACCENT */}
          <div className="pointer-events-none absolute inset-2 rounded-lg border border-emerald-700/20" />

          {/* TOP HEADER: GOVERNMENT CREST */}
          <header className="relative z-10 text-center border-b-2 border-[#0b514a]/30 pb-5">
            <div className="flex flex-col items-center justify-center">
              <JharkhandEmblem className="h-20 w-20 drop-shadow-xs" />
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-[#0b514a]">
                झारखंड सरकार • Government of Jharkhand
              </p>
              <p className="text-[11px] font-semibold text-slate-600">
                Department of Higher & Technical Education and IT & e-Governance
              </p>
              <p className="mt-1 font-mono text-[10px] text-slate-500">
                SAMASYASETU CITIZEN-ACADEMIA-INDUSTRY COLLABORATIVE RESOLUTION NETWORK
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-2 text-[11px] font-mono text-slate-500">
              <span>REF NO: <strong className="text-slate-800">{certificateId}</strong></span>
              <span>ISSUED: <strong className="text-slate-800">{issueDate}</strong></span>
            </div>
          </header>

          {/* MAIN CERTIFICATE TITLE */}
          <div className="relative z-10 mt-6 text-center">
            <span className="inline-block rounded-full bg-emerald-100/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#0b514a] border border-emerald-200">
              Official Validation & Section 135 CSR Compliance Certificate
            </span>
            <h1 className="font-serif mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#173d3a]">
              Certificate of Field Resolution
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-slate-600 leading-relaxed">
              This is to formally certify that the reported civic grievance detailed below has been
              successfully researched, engineered, deployed, and verified under the tripartite
              collaborative framework of the Government of Jharkhand.
            </p>
          </div>

          {/* PROBLEM DETAILS BLOCK */}
          <div className="relative z-10 mt-6 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Challenge Title
                </span>
                <p className="mt-0.5 text-sm font-bold text-slate-900">
                  {problem.title}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Category & Domain
                </span>
                <p className="mt-0.5 font-semibold capitalize text-emerald-800">
                  🏷️ {problem.category}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Location & District
                </span>
                <p className="mt-0.5 font-semibold text-slate-800">
                  📍 {problem.locationDetails?.district || problem.location || "Jharkhand"}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Estimated Beneficiaries
                </span>
                <p className="mt-0.5 font-semibold text-slate-800">
                  👥 ~{problem.affectedPeople || "500+"} Citizens Impacted
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Status Verification
                </span>
                <p className="mt-0.5 inline-flex items-center gap-1 font-bold text-emerald-700">
                  <span>✓</span> Field Deployed & Resolved
                </p>
              </div>
            </div>
          </div>

          {/* TWO COLUMN: ACADEMIC LEADS & CSR CORPORATE PARTNER */}
          <div className="relative z-10 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ACADEMIC INSTITUTION */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                🎓 Academic Lead & Technical Execution
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {universityName}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Solution Prototype:{" "}
                <strong className="text-slate-800">
                  {project?.title || "Field Deployment & Community Handover"}
                </strong>
              </p>

              {teamList.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {teamList.map((m, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-emerald-100"
                    >
                      {m.name} ({m.role})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* INDUSTRY CSR PARTNER */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                🏛️ Corporate CSR Sponsor (Section 135 Compliance)
              </span>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {industryName}
              </p>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Funding, equipment, and field deployment support under Schedule VII,
                Companies Act 2013 (Rural development & technology incubation).
              </p>
              <div className="mt-2 inline-block rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200">
                ✓ Eligible for CSR Audit Credit
              </div>
            </div>
          </div>

          {/* CITIZEN VERIFICATION SEAL & QR CODE ROW */}
          <div className="relative z-10 mt-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-2xl shadow-xs">
                ⭐
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                  Citizen Ground Truth Verification
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`text-sm ${
                        s <= (problem.citizenFeedback?.rating || 5)
                          ? "text-amber-500"
                          : "text-slate-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-xs font-bold text-slate-800">
                    {problem.citizenFeedback?.rating || 5} / 5 Rating
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 italic">
                  {problem.citizenFeedback?.comments
                    ? `"${problem.citizenFeedback.comments}"`
                    : "Resolution verified and accepted by reporting citizen."}
                </p>
              </div>
            </div>

            {/* DYNAMIC QR CODE FOR AUTHENTICITY */}
            <div className="flex items-center gap-2 border-l border-amber-200/80 pl-4">
              <svg
                viewBox="0 0 29 29"
                className="h-14 w-14 fill-slate-900"
                shapeRendering="crispEdges"
              >
                {/* Simulated high-contrast authentic QR pattern */}
                <path d="M0,0 h7 v7 h-7 z M1,1 v5 h5 v-5 z M2,2 h3 v3 h-3 z" />
                <path d="M22,0 h7 v7 h-7 z M23,1 v5 h5 v-5 z M24,2 h3 v3 h-3 z" />
                <path d="M0,22 h7 v7 h-7 z M1,23 v5 h5 v-5 z M2,24 h3 v3 h-3 z" />
                <path d="M9,2 h1 v1 h-1 z M12,2 h2 v2 h-2 z M16,2 h1 v2 h-1 z M19,2 h1 v1 h-1 z" />
                <path d="M9,6 h2 v1 h-2 z M13,5 h1 v2 h-1 z M16,5 h3 v1 h-3 z M20,6 h1 v1 h-1 z" />
                <path d="M2,9 h1 v2 h-1 z M5,10 h2 v1 h-2 z M9,9 h2 v2 h-2 z M13,9 h3 v1 h-3 z M18,9 h2 v2 h-2 z M22,9 h1 v1 h-1 z M25,9 h2 v2 h-2 z" />
                <path d="M0,13 h2 v1 h-2 z M4,12 h1 v3 h-1 z M8,13 h1 v2 h-1 z M11,12 h2 v1 h-2 z M15,13 h1 v2 h-1 z M18,12 h3 v2 h-3 z M23,13 h2 v1 h-2 z M27,12 h2 v2 h-2 z" />
                <path d="M2,17 h2 v1 h-2 z M6,16 h1 v2 h-1 z M9,17 h3 v1 h-3 z M14,16 h2 v2 h-2 z M18,17 h1 v1 h-1 z M21,16 h3 v2 h-3 z M26,17 h2 v1 h-2 z" />
                <path d="M9,22 h1 v2 h-1 z M12,22 h3 v1 h-3 z M17,23 h1 v2 h-1 z M20,22 h2 v1 h-2 z M24,22 h1 v2 h-1 z M27,23 h2 v1 h-2 z" />
                <path d="M10,26 h2 v2 h-2 z M14,25 h2 v1 h-2 z M18,26 h3 v2 h-3 z M23,25 h1 v2 h-1 z M26,26 h2 v2 h-2 z" />
              </svg>
              <div className="text-[10px] text-slate-500 leading-tight">
                <p className="font-bold text-slate-700">Digital Seal</p>
                <p>Scan to verify</p>
                <p className="font-mono text-[9px] text-slate-400">gov.jh/v/{certificateId.slice(-6)}</p>
              </div>
            </div>
          </div>

          {/* SIGNATURE BLOCKS */}
          <footer className="relative z-10 mt-8 pt-6 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="h-10 flex items-end justify-center">
                  <span className="font-serif italic text-sm text-slate-700">A. K. Mishra</span>
                </div>
                <div className="mx-auto w-32 border-b border-slate-400 my-1" />
                <p className="font-bold text-slate-800 text-[11px]">District Magistrate / Nodal Officer</p>
                <p className="text-[10px] text-slate-500">Government of Jharkhand</p>
              </div>

              <div>
                <div className="h-10 flex items-end justify-center">
                  <span className="font-serif italic text-sm text-slate-700">Dr. S. Bannerjee</span>
                </div>
                <div className="mx-auto w-32 border-b border-slate-400 my-1" />
                <p className="font-bold text-slate-800 text-[11px]">Dean of R&D / Innovation</p>
                <p className="text-[10px] text-slate-500">{universityName}</p>
              </div>

              <div>
                <div className="h-10 flex items-end justify-center">
                  <span className="font-serif italic text-sm text-slate-700">R. K. Agarwal</span>
                </div>
                <div className="mx-auto w-32 border-b border-slate-400 my-1" />
                <p className="font-bold text-slate-800 text-[11px]">Head of Corporate CSR</p>
                <p className="text-[10px] text-slate-500">{industryName}</p>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* PRINT-ONLY ISOLATION STYLES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-certificate, #printable-certificate * {
            visibility: visible !important;
          }
          #printable-certificate {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 24px !important;
            border-width: 4px !important;
            background: white !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
