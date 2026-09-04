import { useEffect, useState } from "react";

import { getProblemById } from "../services/problemService";

import {
  updateProblemStatus,
  assignPartnerToProblem,
  rerunRouting,
  deleteProblemByAdmin,
} from "../services/adminService";

import { getAllPartners } from "../services/partnerService";

import AIDuplicateAnalysisCard from "../components/AIDuplicateAnalysisCard";

import ProposalList from "../components/ProposalList";

import {
  getProposalsForProblem,
  reviewProposal,
} from "../services/proposalService";

import ProblemEvidence from "../components/ProblemEvidence";

import LifecycleStepper from "../components/LifecycleStepper";

import ResolutionProof from "../components/ResolutionProof";

import ExportBriefButton from "../components/ExportBriefButton";

const statusStyles = {
  submitted: "bg-[#f7ebd8] text-[#a25a1b]",
  under_review: "bg-[#d8ebe4] text-[#087f70]",
  assigned: "bg-[#e5dcf2] text-[#564680]",
  in_progress: "bg-[#fbe5d8] text-[#b05c2d]",
  solved: "bg-[#e1f1ed] text-[#087f70]",
};

const statusLabels = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned",
  in_progress: "In Progress",
  solved: "Solved",
};

const categoryNames = {
  agriculture: "Agriculture",
  healthcare: "Healthcare",
  education: "Education",
  water: "Water Management",
  environment: "Environment",
  transportation: "Transportation",
  energy: "Energy",
  waste: "Waste Management",
  public_safety: "Public Safety",
  technology: "Technology",
  other: "Other",
};

const AdminProblemDetails = ({ problemId, setAdminPage }) => {
  // ========================================
  // STATE
  // ========================================

  const [problem, setProblem] = useState(null);

  const [partners, setPartners] = useState([]);

  const [selectedPartner, setSelectedPartner] = useState("");

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [assigningPartner, setAssigningPartner] = useState(false);

  const [candidateMatches, setCandidateMatches] = useState([]);

  const [suggestedPartners, setSuggestedPartners] = useState([]);

  const [proposals, setProposals] = useState([]);
  const [reviewingProposalId, setReviewingProposalId] = useState(null);

  const [routing, setRouting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ========================================
  // FETCH DATA
  // ========================================
  // `silent` refetches without flipping the page back to the
  // loading screen, so the AI review card stays mounted and
  // keeps its success/error message after an action.

  const fetchData = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login first.");

        return;
      }

      const [problemData, partnersData, proposalsData] = await Promise.all([
        getProblemById(problemId, token),
        getAllPartners(token),
        getProposalsForProblem(problemId, token).catch(() => ({ proposals: [] })),
      ]);

      setProblem(problemData.problem);

      setPartners(partnersData.partners || []);

      setCandidateMatches(problemData.problem.candidateMatches || []);

      setSuggestedPartners(problemData.problem.suggestedPartners || []);

      setProposals(proposalsData?.proposals || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to fetch problem details.",
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleReviewProposalDirect = async (proposalId, status) => {
    try {
      setReviewingProposalId(proposalId);
      setMessage("");
      const token = localStorage.getItem("token");

      const reviewNotes = prompt(
        status === "approved"
          ? "Enter approval notes (optional):"
          : "Enter rejection reason (optional):"
      );

      await reviewProposal(proposalId, status, reviewNotes || "", token);
      await fetchData({ silent: true });
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to review proposal."
      );
    } finally {
      setReviewingProposalId(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [problemId]);

  // ========================================
  // UPDATE STATUS
  // ========================================

  const handleStatusChange = async (status) => {
    try {
      setUpdatingStatus(true);

      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login first.");

        return;
      }

      const data = await updateProblemStatus(problemId, status, token);

      const shouldRemovePartner =
        status === "submitted" || status === "under_review";

      setProblem({
        ...data.problem,

        assignedPartner: shouldRemovePartner
          ? null
          : data.problem.assignedPartner,
      });

      // The response now carries the populated AI review data, so keep
      // the card in sync. Skipping this left it rendering stale matches.
      setCandidateMatches(data.problem.candidateMatches || []);

      if (shouldRemovePartner) {
        setSelectedPartner("");
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to update problem status.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ========================================
  // ASSIGN PARTNER
  // ========================================

  const handleAssignPartner = async () => {
    try {
      if (!selectedPartner) {
        setMessage("Please select a partner first.");

        return;
      }

      setAssigningPartner(true);

      setMessage("");

      const token = localStorage.getItem("token");

      const data = await assignPartnerToProblem(
        problemId,
        selectedPartner,
        token,
      );

      setProblem(data.problem);

      setCandidateMatches(data.problem.candidateMatches || []);

      setSelectedPartner("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to assign partner.");
    } finally {
      setAssigningPartner(false);
    }
  };

  // ========================================
  // QUICK ASSIGN FROM AI SUGGESTION
  // ========================================

  const handleQuickAssign = async (partnerId) => {
    try {
      setAssigningPartner(true);

      setMessage("");

      const token = localStorage.getItem("token");

      const data = await assignPartnerToProblem(
        problemId,
        partnerId,
        token,
      );

      setProblem(data.problem);

      setCandidateMatches(data.problem.candidateMatches || []);

      setSelectedPartner("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to assign partner.");
    } finally {
      setAssigningPartner(false);
    }
  };

  // ========================================
  // RUN / RE-RUN AI ROUTING
  // ========================================
  // Computes or refreshes the partner suggestions for this
  // problem using the current partner registry and scoring
  // engine. The response carries the fully populated problem,
  // so the UI updates in place without a page refetch.

  const handleRerunRouting = async () => {
    try {
      setRouting(true);

      setMessage("");

      const token = localStorage.getItem("token");

      const data = await rerunRouting(problemId, token);

      if (data.problem) {
        setProblem(data.problem);

        setCandidateMatches(data.problem.candidateMatches || []);

        setSuggestedPartners(data.problem.suggestedPartners || []);

        setMessage(data.message);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to run AI routing.",
      );
    } finally {
      setRouting(false);
    }
  };

  // ========================================
  // DELETE PROBLEM (ADMIN)
  // ========================================

  const handleDeleteProblem = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete this problem?\n\n"${problem?.title}"\n\nThis cannot be undone and will remove all associated projects, proposals, and records.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setMessage("");

      const token = localStorage.getItem("token");
      await deleteProblemByAdmin(problemId, token);

      // Return to dashboard
      setAdminPage("dashboard");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to delete problem."
      );
      setDeleting(false);
    }
  };

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5]">
        <p className="text-lg font-medium text-[#5c6f69]">
          Loading problem details...
        </p>
      </main>
    );
  }

  // ========================================
  // ERROR WITHOUT PROBLEM
  // ========================================

  if (!problem) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() => setAdminPage("dashboard")}
            className="mb-6 text-sm font-semibold text-[#0b6b60] hover:text-[#087f70]"
          >
            ← Back to Dashboard
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {message || "Problem not found."}
          </div>
        </div>
      </main>
    );
  }

  // ========================================
  // UI
  // ========================================

  const pendingProposals = (proposals || []).filter(
    (p) => p.status === "submitted"
  );

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* TOP BAR */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => setAdminPage("dashboard")}
            className="text-sm font-semibold text-[#0b6b60] transition hover:text-[#087f70]"
          >
            ← Back to Dashboard
          </button>

          <div className="flex items-center gap-3">
            <ExportBriefButton />

            <button
              type="button"
              onClick={handleDeleteProblem}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              title="Permanently delete this problem and associated records"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>{deleting ? "Deleting..." : "Delete Problem"}</span>
            </button>
          </div>
        </div>

        {/* LIFECYCLE PROGRESS STEPPER */}

        <LifecycleStepper
          status={problem.status}
          assignedPartner={problem.assignedPartner}
          createdAt={problem.createdAt}
          updatedAt={problem.updatedAt}
          className="mb-8"
        />

        {/* MESSAGE */}

        {message && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {message}
          </div>
        )}

        {/* PROPOSAL AWAITING REVIEW BANNER */}
        {pendingProposals.length > 0 && (
          <section className="mb-8 overflow-hidden rounded-2xl border-2 border-[#a25a1b] bg-gradient-to-br from-[#fefcf8] via-white to-[#fbf4ea] p-6 shadow-md sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#a25a1b] text-white shadow-sm sm:h-14 sm:w-14">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#a25a1b] px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                      Action Required
                    </span>
                    <span className="text-xs font-semibold text-[#a25a1b]">
                      Solution Proposal Awaiting Approval
                    </span>
                  </div>

                  <h2 className="mt-2 text-xl font-bold text-[#173d3a] sm:text-2xl">
                    {pendingProposals[0].university?.name || "Assigned University"} Submitted a Solution Proposal
                  </h2>

                  <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#4b5e58]">
                    <strong className="text-[#173d3a]">
                      "{pendingProposals[0].title}"
                    </strong>
                    {pendingProposals[0].submittedBy?.name && (
                      <> submitted by <strong className="text-[#173d3a]">{pendingProposals[0].submittedBy.name}</strong></>
                    )}
                    . Review the proposed technical approach below and approve to authorize work.
                  </p>

                  <div className="mt-3 rounded-xl border border-[#ecd9c6] bg-white/85 p-3.5 text-xs text-[#5c6f69] sm:text-sm">
                    <p className="font-semibold text-[#173d3a]">Proposed Methodology & Approach:</p>
                    <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[#5c6f69] sm:text-sm">
                      {pendingProposals[0].approach}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
                <button
                  type="button"
                  onClick={() => handleReviewProposalDirect(pendingProposals[0]._id, "approved")}
                  disabled={reviewingProposalId === pendingProposals[0]._id}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0b6b60] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#087f70] disabled:opacity-50"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {reviewingProposalId === pendingProposals[0]._id ? "Approving..." : "Approve Proposal"}
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewProposalDirect(pendingProposals[0]._id, "rejected")}
                  disabled={reviewingProposalId === pendingProposals[0]._id}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-600 shadow-2xs transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {reviewingProposalId === pendingProposals[0]._id ? "Rejecting..." : "Reject Proposal"}
                </button>

                <a
                  href="#proposals-section"
                  className="text-xs font-semibold text-[#a25a1b] underline hover:text-[#804615]"
                >
                  View full technical details ↓
                </a>
              </div>
            </div>
          </section>
        )}

        {/* RESOLUTION APPROVAL REVIEW BANNER */}
        {problem.status !== "solved" && problem.resolutionSubmitted && (
          <section className="mb-8 overflow-hidden rounded-2xl border-2 border-[#0b6b60] bg-gradient-to-br from-[#eef7f4] via-white to-[#edf7f4] p-6 shadow-md sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b6b60] text-white shadow-sm sm:h-14 sm:w-14">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-7 w-7">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#0b6b60] px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                      Action Required
                    </span>
                    <span className="text-xs font-semibold text-[#0b6b60]">
                      Solution Project Completed
                    </span>
                  </div>

                  <h2 className="mt-2 text-xl font-bold text-[#173d3a] sm:text-2xl">
                    University & Industry Solution Ready for Government Approval
                  </h2>

                  <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#4b5e58]">
                    <strong className="text-[#173d3a]">
                      {problem.resolutionDetails?.leadPartner || (typeof problem.assignedPartner === "object" ? problem.assignedPartner?.name : "The assigned partner")}
                    </strong>
                    {problem.resolutionDetails?.collaborators && problem.resolutionDetails.collaborators.length > 0 && (
                      <> in collaboration with <strong className="text-[#173d3a]">{problem.resolutionDetails.collaborators.join(", ")}</strong></>
                    )}
                    {" "}has marked project work on <em>"{problem.resolutionDetails?.projectTitle || "Solution Initiative"}"</em> as completed. Review the outcomes below and approve to finalize resolution for the citizen.
                  </p>

                  {problem.resolutionDetails?.outcomes && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#315d56]">
                      {Object.entries(problem.resolutionDetails.outcomes)
                        .filter(([, count]) => Number(count) > 0)
                        .map(([metric, count]) => (
                          <span key={metric} className="rounded-full bg-[#d8ebe4] px-2.5 py-1 capitalize">
                            {count} {metric}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleStatusChange("solved")}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0b6b60] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#074f46] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {updatingStatus ? "Approving..." : "Approve & Mark Solved"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* MAIN CARD */}

        <article className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm sm:p-10">
          {/* HEADER */}

          <div className="flex flex-col gap-4 border-b border-[#e3e9e3] pb-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-[#d8ebe4] px-3 py-1 text-sm font-semibold text-[#087f70]">
                {categoryNames[problem.category?.toLowerCase()] || "Other"}
              </span>

              <h1 className="mt-4 text-3xl font-bold text-[#173d3a]">
                {problem.title}
              </h1>
            </div>

            {/* STATUS BADGE */}

            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
                statusStyles[problem.status] || "bg-[#f7f8f5] text-[#315d56]"
              }`}
            >
              {statusLabels[problem.status] || problem.status}
            </span>
          </div>

          {/* ========================================
              AI INSIGHTS
          ======================================== */}
          {/* Priority, summary and cluster signals so the
              admin can triage before reading the full report. */}

          {(problem.aiSummary || problem.aiPriorityScore > 0) && (
            <section className="mt-8 rounded-2xl border border-[#cfe4dc] bg-[#e9f4f0]/50 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-[#173d3a]">
                  AI Insights
                </h2>

                {problem.aiPriorityScore > 0 && (
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                      problem.aiPriorityBand === "urgent"
                        ? "bg-[#fbe5d8] text-[#b05c2d]"
                        : problem.aiPriorityBand === "elevated"
                          ? "bg-[#f7ebd8] text-[#a25a1b]"
                          : "bg-[#f2f5f1] text-[#5c6f69]"
                    }`}
                  >
                    {problem.aiPriorityBand === "urgent"
                      ? "Urgent"
                      : problem.aiPriorityBand === "elevated"
                        ? "Elevated"
                        : "Standard"}{" "}
                    · {problem.aiPriorityScore}/100
                  </span>
                )}
              </div>

              {problem.aiPriorityBreakdown && (
                <p className="mt-2 text-sm text-[#5c6f69]">
                  Why: {problem.aiPriorityBreakdown}
                </p>
              )}

              {problem.aiSummary && (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#899892]">
                    AI summary
                  </p>

                  <p className="mt-2 leading-relaxed text-[#315d56]">
                    {problem.aiSummary}
                  </p>
                </div>
              )}

              {(problem.clusterSize || 0) > 1 && (
                <p className="mt-4 text-sm font-semibold text-[#564680]">
                  ⚡ {problem.clusterSize} citizens reported this issue in this
                  area
                </p>
              )}
            </section>
          )}

          {/* DESCRIPTION */}

          <section className="mt-8">
            <h2 className="text-lg font-bold text-[#173d3a]">
              Problem Description
            </h2>

            <p className="mt-3 leading-relaxed text-[#5c6f69]">
              {problem.description}
            </p>
          </section>

          {/* ========================================
              PROBLEM PHOTOS
          ======================================== */}

          {problem.images && problem.images.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-[#173d3a]">
                Problem Photos
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {problem.images.map((image, index) => (
                  <div
                    key={image.publicId || `${problem._id}-${index}`}
                    className="overflow-hidden rounded-xl border border-[#e3e9e3] bg-[#f7f8f5]"
                  >
                    <img
                      src={image.url}
                      alt={`Problem photo ${index + 1}`}
                      className="h-52 w-full object-cover transition duration-200 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {(!problem.images || problem.images.length === 0) && (
            <section className="mt-8">
              <h2 className="text-lg font-bold text-[#173d3a]">
                Problem Photos
              </h2>

              <div className="mt-4 rounded-xl border border-[#e3e9e3] bg-[#f2f5f1] p-5 text-center">
                <p className="text-sm text-[#71827c]">
                  📷 No photos uploaded for this problem.
                </p>
              </div>
            </section>
          )}

          {/* ========================================
              VIDEO + DOCUMENT EVIDENCE
          ======================================== */}

          <ProblemEvidence problem={problem} className="mt-8" />

          {/* INFORMATION GRID */}

          <section className="mt-8 grid gap-5 sm:grid-cols-2">
            <InfoCard label="Location" value={`📍 ${problem.location}`} />

            <InfoCard
              label="Category"
              value={`🏷️ ${
                categoryNames[problem.category?.toLowerCase()] || "Other"
              }`}
            />

            <InfoCard
              label="Submitted On"
              value={
                problem.createdAt
                  ? new Date(problem.createdAt).toLocaleDateString()
                  : "Unknown date"
              }
            />

            <InfoCard
              label="Submitted By"
              value={problem.submittedBy?.name || "Unknown citizen"}
              secondary={problem.submittedBy?.email}
            />
          </section>

          {/* ASSIGNED PARTNER */}

          <section className="mt-8">
            <h2 className="text-lg font-bold text-[#173d3a]">
              Assigned Partner
            </h2>

            {problem.assignedPartner ? (
              <div className="mt-4 rounded-xl border border-[#d5c9ea] bg-[#f0ecf8] p-5">
                <p className="text-lg font-bold text-[#3d2f63]">
                  🏢 {problem.assignedPartner.name}
                </p>

                <p className="mt-1 text-sm text-[#564680]">
                  {problem.assignedPartner.type}
                </p>

                {problem.assignedPartner.location && (
                  <p className="mt-2 text-sm text-[#564680]">
                    📍 {problem.assignedPartner.location}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-[#e3e9e3] bg-[#f2f5f1] p-5 text-[#71827c]">
                No partner has been assigned yet.
              </div>
            )}
          </section>

          {/* ========================================
              PROPOSALS
          ======================================== */}

          <section id="proposals-section" className="mt-10">
            <ProposalList
              isAdmin={true}
              problemId={problemId}
              onProposalReviewed={() => fetchData({ silent: true })}
            />
          </section>

          {/* ========================================
              AI DUPLICATE ANALYSIS
          ======================================== */}

          {/* ========================================
              AI PARTNER SUGGESTIONS
          ======================================== */}

          <section className="mt-10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#173d3a]">
                  AI Partner Suggestions
                </h2>

                <p className="mt-1 text-sm text-[#71827c]">
                  Top universities and industries matched to this problem by the AI routing engine.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRerunRouting}
                disabled={routing}
                className="rounded-lg border border-[#0b514a] px-4 py-2 text-sm font-semibold text-[#0b514a] transition hover:bg-[#e9f4f0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {routing
                  ? "Running AI routing..."
                  : suggestedPartners.length > 0
                    ? "↻ Re-run"
                    : "✨ Run AI Routing"}
              </button>
            </div>

            {suggestedPartners.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-[#c7d5cd] bg-white p-8 text-center">
                <p className="text-sm font-semibold text-[#315d56]">
                  No partner suggestions yet
                </p>

                <p className="mt-1 text-sm text-[#71827c]">
                  Run the AI routing engine to match this problem against the
                  partner registry — expertise, geography, work phase and
                  capabilities.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {suggestedPartners.map((suggestion, index) => (
                  <div
                    key={suggestion.partner._id}
                    className="rounded-xl border border-[#e3e9e3] bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0b514a] text-sm font-bold text-[#e9c985]">
                          {index + 1}
                        </span>

                        <div>
                          <p className="font-semibold text-[#173d3a]">
                            {suggestion.partner.name}
                          </p>

                          <p className="text-xs text-[#71827c]">
                            {suggestion.reason}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            suggestion.partner.type === "university"
                              ? "bg-[#d8ebe4] text-[#087f70]"
                              : suggestion.partner.type === "industry"
                                ? "bg-[#f7ebd8] text-[#a25a1b]"
                                : "bg-[#e2e9f4] text-[#31527c]"
                          }`}
                        >
                          {suggestion.partner.type}
                        </span>

                        <span className="rounded-full bg-[#e2e9f4] px-3 py-1 text-xs font-bold text-[#31527c]">
                          {Math.round(suggestion.matchScore * 100)}% match
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickAssign(suggestion.partner._id)}
                        disabled={assigningPartner || problem.assignedPartner?._id === suggestion.partner._id}
                        className="rounded-lg bg-[#564680] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#463872] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {problem.assignedPartner?._id === suggestion.partner._id
                          ? "Already Assigned"
                          : assigningPartner
                            ? "Assigning..."
                            : "Assign This Partner"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ========================================
              AI DUPLICATE ANALYSIS
          ======================================== */}

          <section className="mt-10">
            <AIDuplicateAnalysisCard
              candidateMatches={candidateMatches}
              problemId={problemId}
              aiReviewStatus={problem.aiReviewStatus}
              parentProblem={problem.parentProblem}
              analyzedAt={problem.aiDuplicateAnalyzedAt}
              onReviewComplete={() => fetchData({ silent: true })}
            />
          </section>

          {/* MANAGEMENT */}

          <section className="mt-10 border-t border-[#e3e9e3] pt-8">
            <h2 className="text-xl font-bold text-[#173d3a]">Manage Problem</h2>

            <p className="mt-1 text-sm text-[#71827c]">
              Update the problem status or assign a partner organization.
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* STATUS MANAGEMENT */}

              <div className="rounded-xl border border-[#e3e9e3] p-5">
                <h3 className="font-semibold text-[#173d3a]">Update Status</h3>

                <select
                  value={problem.status}
                  disabled={updatingStatus}
                  onChange={(event) => handleStatusChange(event.target.value)}
                  className="mt-4 w-full rounded-xl border border-[#dbe5df] bg-white px-4 py-3 text-sm text-[#315d56] outline-none focus:border-[#62a99b]"
                >
                  <option value="submitted">Submitted</option>

                  <option value="under_review">Under Review</option>

                  <option value="assigned">Assigned</option>

                  <option value="in_progress">In Progress</option>

                  <option value="solved">Solved</option>
                </select>

                {updatingStatus && (
                  <p className="mt-3 text-sm text-[#0b6b60]">
                    Updating status...
                  </p>
                )}
              </div>

              {/* PARTNER MANAGEMENT */}

              <div className="rounded-xl border border-[#e3e9e3] p-5">
                <h3 className="font-semibold text-[#173d3a]">
                  {problem.assignedPartner
                    ? "Change Partner"
                    : "Assign Partner"}
                </h3>

                <select
                  value={selectedPartner}
                  disabled={assigningPartner}
                  onChange={(event) => setSelectedPartner(event.target.value)}
                  className="mt-4 w-full rounded-xl border border-[#dbe5df] bg-white px-4 py-3 text-sm text-[#315d56] outline-none focus:border-[#8a76b8]"
                >
                  <option value="">Select Partner</option>

                  {partners.map((partner) => (
                    <option key={partner._id} value={partner._id}>
                      {partner.name} ({partner.type})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAssignPartner}
                  disabled={assigningPartner || !selectedPartner}
                  className="mt-4 w-full rounded-xl bg-[#564680] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#463872] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assigningPartner
                    ? "Assigning..."
                    : problem.assignedPartner
                      ? "Change Partner"
                      : "Assign Partner"}
                </button>
              </div>
            </div>
          </section>
        </article>

        {/* RESOLUTION PROOF (SOLVED CHALLENGES) */}
        <ResolutionProof problem={problem} className="mt-8" />
      </div>
    </main>
  );
};

// ========================================
// INFO CARD
// ========================================

const InfoCard = ({ label, value, secondary }) => {
  return (
    <div className="rounded-xl bg-[#f2f5f1] p-5">
      <p className="text-sm font-medium text-[#71827c]">{label}</p>

      <p className="mt-2 font-semibold text-[#173d3a]">{value}</p>

      {secondary && <p className="mt-1 text-sm text-[#71827c]">{secondary}</p>}
    </div>
  );
};

export default AdminProblemDetails;
