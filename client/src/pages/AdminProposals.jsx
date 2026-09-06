import { useEffect, useMemo, useState } from "react";
import {
  getAllProposals,
  reviewProposal,
} from "../services/proposalService";

// ========================================
// FORMAT HELPERS
// ========================================

const formatStatus = (status) => {
  switch (status) {
    case "submitted":
      return "Submitted (Pending Review)";
    case "under_review":
      return "Under Review";
    case "approved":
      return "Approved for Execution";
    case "rejected":
      return "Needs Revision / Rejected";
    default:
      return status || "Pending";
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case "submitted":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "under_review":
      return "border-yellow-300 bg-yellow-50 text-yellow-800";
    case "approved":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "rejected":
      return "border-red-300 bg-red-50 text-red-700";
    default:
      return "border-slate-300 bg-slate-50 text-slate-700";
  }
};

const AdminProposals = ({ setAdminPage, setSelectedAdminProblemId }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [reviewingId, setReviewingId] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ========================================
  // FETCH ALL PROPOSALS
  // ========================================

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Please login as administrator.");
        setMessageType("error");
        return;
      }

      const data = await getAllProposals(token);
      setProposals(data.proposals || []);
    } catch (error) {
      console.error("Fetch proposals error:", error);
      setMessage(
        error.response?.data?.message || "Failed to load solution proposals."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // ========================================
  // REVIEW PROPOSAL (APPROVE / REJECT)
  // ========================================

  const handleReview = async (proposalId, status) => {
    try {
      setReviewingId(proposalId);
      setMessage("");

      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Session expired. Please log in again.");
        setMessageType("error");
        return;
      }

      const promptText =
        status === "approved"
          ? "Enter government approval remarks or directives (optional):"
          : "Enter reason for rejection or required revisions:";

      const reviewNotes = window.prompt(promptText, "");
      if (status === "rejected" && reviewNotes === null) {
        setReviewingId(null);
        return; // User cancelled prompt
      }

      await reviewProposal(proposalId, status, reviewNotes || "", token);

      setMessage(`Proposal ${status === "approved" ? "approved" : "rejected"} successfully.`);
      setMessageType("success");

      await fetchProposals();
    } catch (error) {
      console.error("Review error:", error);
      setMessage(
        error.response?.data?.message || "Failed to submit proposal review."
      );
      setMessageType("error");
    } finally {
      setReviewingId(null);
    }
  };

  // ========================================
  // STATS & FILTERING
  // ========================================

  const stats = useMemo(() => {
    const all = proposals.length;
    const pending = proposals.filter(
      (p) => p.status === "submitted" || p.status === "under_review"
    ).length;
    const approved = proposals.filter((p) => p.status === "approved").length;
    const rejected = proposals.filter((p) => p.status === "rejected").length;
    return { all, pending, approved, rejected };
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return proposals.filter((p) => {
      // Status filter
      if (statusFilter === "pending") {
        if (p.status !== "submitted" && p.status !== "under_review") return false;
      } else if (statusFilter !== "all") {
        if (p.status !== statusFilter) return false;
      }

      // Search filter
      if (!q) return true;

      const searchable = [
        p.title,
        p.description,
        p.approach,
        p.university?.name,
        p.problem?.title,
        p.problem?.location,
        p.problem?.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [proposals, statusFilter, searchQuery]);

  const handleOpenProblem = (problemId) => {
    if (!problemId) return;
    if (setSelectedAdminProblemId) {
      setSelectedAdminProblemId(problemId);
    }
    if (setAdminPage) {
      setAdminPage("problem-details");
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0b514a]/20 bg-[#e9f4f0] px-3.5 py-1 text-xs font-bold text-[#0b6b60]">
              <span>🏛️ GOVERNMENT REVIEW PORTAL</span>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#173d3a] sm:text-4xl">
              University Solution Proposals
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5c6f69] sm:text-base">
              Review scientific methodologies, budgets, team structures, and milestones submitted by universities for assigned civic problems across Jharkhand.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchProposals}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#dbe5df] bg-white px-4 py-2.5 text-sm font-semibold text-[#173d3a] shadow-xs transition hover:border-[#62a99b] hover:bg-[#f7f8f5] disabled:opacity-50"
          >
            <span className={loading ? "animate-spin" : ""}>↻</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* ALERTS */}
        {message && (
          <div
            className={`mb-6 rounded-2xl border p-4 text-sm font-medium ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* METRICS ROW */}
        <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div
            onClick={() => setStatusFilter("all")}
            className={`cursor-pointer rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-sm ${
              statusFilter === "all"
                ? "border-[#0b514a] ring-2 ring-[#0b514a]/20"
                : "border-[#e3e9e3]"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[#71827c]">
              Total Proposals
            </p>
            <p className="mt-2 text-3xl font-extrabold text-[#173d3a]">
              {stats.all}
            </p>
            <p className="mt-1 text-xs text-[#5c6f69]">Across all universities</p>
          </div>

          <div
            onClick={() => setStatusFilter("pending")}
            className={`cursor-pointer rounded-2xl border bg-gradient-to-br from-[#fefcf8] to-white p-5 shadow-xs transition hover:shadow-sm ${
              statusFilter === "pending"
                ? "border-[#a25a1b] ring-2 ring-[#a25a1b]/20"
                : "border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-[#a25a1b]">
                Action Required
              </p>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-[#a25a1b]">
              {stats.pending}
            </p>
            <p className="mt-1 text-xs text-[#a25a1b]/80">Awaiting Govt review</p>
          </div>

          <div
            onClick={() => setStatusFilter("approved")}
            className={`cursor-pointer rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-sm ${
              statusFilter === "approved"
                ? "border-emerald-600 ring-2 ring-emerald-600/20"
                : "border-[#e3e9e3]"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Approved
            </p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-700">
              {stats.approved}
            </p>
            <p className="mt-1 text-xs text-[#5c6f69]">Authorized for execution</p>
          </div>

          <div
            onClick={() => setStatusFilter("rejected")}
            className={`cursor-pointer rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-sm ${
              statusFilter === "rejected"
                ? "border-red-600 ring-2 ring-red-600/20"
                : "border-[#e3e9e3]"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">
              Needs Revision
            </p>
            <p className="mt-2 text-3xl font-extrabold text-red-600">
              {stats.rejected}
            </p>
            <p className="mt-1 text-xs text-[#5c6f69]">Sent back for changes</p>
          </div>
        </section>

        {/* FILTERS & SEARCH */}
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#e3e9e3] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: `All (${stats.all})` },
              { key: "pending", label: `Awaiting Review (${stats.pending})` },
              { key: "approved", label: `Approved (${stats.approved})` },
              { key: "rejected", label: `Rejected (${stats.rejected})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  statusFilter === tab.key
                    ? "bg-[#0b514a] text-white shadow-xs"
                    : "border border-[#e3e9e3] bg-[#f7f8f5] text-[#5c6f69] hover:bg-[#e9f4f0] hover:text-[#0b514a]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by proposal, university, problem..."
              className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] py-2.5 pl-9 pr-4 text-xs text-[#173d3a] outline-none transition focus:border-[#62a99b] focus:ring-2 focus:ring-[#dff1eb]"
            />
            <span className="absolute left-3 top-2.5 text-xs text-[#71827c]">🔍</span>
          </div>
        </div>

        {/* PROPOSALS LIST */}
        {loading ? (
          <div className="rounded-2xl border border-[#e3e9e3] bg-white p-12 text-center shadow-xs">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0b514a] border-r-transparent" />
            <p className="mt-3 text-sm font-semibold text-[#173d3a]">
              Loading university proposals...
            </p>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="rounded-2xl border border-[#e3e9e3] bg-white p-12 text-center shadow-xs">
            <p className="text-3xl">📑</p>
            <h3 className="mt-3 text-lg font-bold text-[#173d3a]">
              No proposals found
            </h3>
            <p className="mt-1 text-sm text-[#71827c]">
              {searchQuery
                ? "Try refining your search terms or changing the status filter."
                : "No proposals have been submitted under this category yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProposals.map((proposal) => {
              const isPending =
                proposal.status === "submitted" ||
                proposal.status === "under_review";
              const problemId =
                typeof proposal.problem === "object"
                  ? proposal.problem?._id
                  : proposal.problem;

              return (
                <article
                  key={proposal._id}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-xs transition hover:shadow-sm ${
                    isPending
                      ? "border-2 border-amber-300 ring-4 ring-amber-50"
                      : "border-[#e3e9e3]"
                  }`}
                >
                  {/* TOP BANNER: UNIVERSITY & STATUS */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f3ef] bg-[#fbfdfc] px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b514a] text-lg font-bold text-white shadow-xs">
                        🏛️
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#173d3a]">
                            {proposal.university?.name || "Assigned University"}
                          </h3>
                          <span className="rounded-full bg-[#d8ebe4] px-2 py-0.5 text-[10px] font-bold text-[#087f70] uppercase">
                            {proposal.university?.type || "University Partner"}
                          </span>
                        </div>
                        <p className="text-xs text-[#71827c]">
                          Submitted by {proposal.submittedBy?.name || "Faculty Rep"} •{" "}
                          {new Date(proposal.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadge(
                          proposal.status
                        )}`}
                      >
                        {isPending && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                        )}
                        {formatStatus(proposal.status)}
                      </span>
                    </div>
                  </div>

                  {/* BODY */}
                  <div className="p-6">
                    {/* PROBLEM REFERENCE CALLOUT */}
                    {proposal.problem && (
                      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dbe5df] bg-[#f7f8f5] p-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#0b514a] uppercase tracking-wider">
                              Target Problem
                            </span>
                            <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-[#71827c] border border-[#e3e9e3]">
                              {proposal.problem.category}
                            </span>
                          </div>
                          <p className="mt-1 font-bold text-[#173d3a] sm:text-base truncate">
                            {proposal.problem.title}
                          </p>
                          <p className="mt-0.5 text-xs text-[#71827c]">
                            📍 {proposal.problem.location}
                          </p>
                        </div>

                        {problemId && (
                          <button
                            type="button"
                            onClick={() => handleOpenProblem(problemId)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#0b514a] bg-white px-3 py-2 text-xs font-bold text-[#0b514a] shadow-2xs transition hover:bg-[#e9f4f0]"
                          >
                            <span>Inspect Problem & AI Routing</span>
                            <span>→</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* PROPOSAL TITLE & DESCRIPTION */}
                    <h2 className="text-xl font-bold text-[#173d3a]">
                      {proposal.title}
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-[#4b5e58]">
                      {proposal.description}
                    </p>

                    {/* APPROACH CALLOUT */}
                    <div className="mt-4 rounded-xl border border-[#d8ebe4] bg-[#f2f9f6] p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#087f70]">
                        Proposed Methodology & Technical Solution
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#214a42] sm:text-sm whitespace-pre-line">
                        {proposal.approach}
                      </p>
                    </div>

                    {/* TEAM & MILESTONES GRID */}
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      {/* TEAM */}
                      <div className="rounded-xl border border-[#e3e9e3] bg-[#fbfdfc] p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#315d56]">
                          👥 Faculty & Research Team ({proposal.team?.length || 0})
                        </p>
                        {proposal.team && proposal.team.length > 0 ? (
                          <ul className="mt-2.5 space-y-2">
                            {proposal.team.map((member, idx) => (
                              <li
                                key={idx}
                                className="flex items-center justify-between text-xs"
                              >
                                <div>
                                  <strong className="text-[#173d3a]">
                                    {member.name}
                                  </strong>
                                  <span className="ml-2 text-[#71827c]">
                                    ({member.role})
                                  </span>
                                </div>
                                <span className="text-[#5c6f69] font-mono text-[11px]">
                                  {member.email}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-[#71827c]">
                            No individual team members listed.
                          </p>
                        )}
                      </div>

                      {/* MILESTONES / TIMELINE */}
                      <div className="rounded-xl border border-[#e3e9e3] bg-[#fbfdfc] p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#315d56]">
                          ⏱️ Milestones & Execution Schedule
                        </p>
                        {proposal.timeline?.milestones &&
                        proposal.timeline.milestones.length > 0 ? (
                          <ul className="mt-2.5 space-y-2">
                            {proposal.timeline.milestones.map((m, idx) => (
                              <li
                                key={idx}
                                className="flex items-start justify-between gap-2 text-xs"
                              >
                                <span className="text-[#173d3a] font-medium">
                                  {idx + 1}. {m.title}
                                </span>
                                {m.dueDate && (
                                  <span className="shrink-0 text-[11px] text-[#71827c]">
                                    Target:{" "}
                                    {new Date(m.dueDate).toLocaleDateString(
                                      undefined,
                                      { month: "short", day: "numeric" }
                                    )}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-xs text-[#71827c]">
                            Standard 4-week execution timeline.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* REVIEW NOTES (IF PREVIOUSLY REVIEWED) */}
                    {proposal.reviewNotes && (
                      <div className="mt-4 rounded-xl border border-[#e3e9e3] bg-[#f7f8f5] p-3 text-xs text-[#5c6f69]">
                        <strong className="text-[#173d3a]">
                          Government Review Notes:
                        </strong>{" "}
                        {proposal.reviewNotes}
                        {proposal.reviewedBy?.name && (
                          <span className="ml-2 text-[#71827c]">
                            (by {proposal.reviewedBy.name})
                          </span>
                        )}
                      </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f3ef] pt-4">
                      <div className="text-xs text-[#71827c]">
                        {isPending ? (
                          <span className="font-semibold text-amber-800">
                            ⚡ Government authorization required to commence work
                          </span>
                        ) : (
                          <span>
                            Status finalized:{" "}
                            <strong className="capitalize">{proposal.status}</strong>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReview(proposal._id, "approved")}
                              disabled={reviewingId === proposal._id}
                              className="inline-flex items-center gap-2 rounded-xl bg-[#0b6b60] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#087f70] disabled:opacity-50"
                            >
                              <span>✓</span>
                              <span>
                                {reviewingId === proposal._id
                                  ? "Approving..."
                                  : "Approve Proposal"}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReview(proposal._id, "rejected")}
                              disabled={reviewingId === proposal._id}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-xs font-bold text-red-600 shadow-2xs transition hover:bg-red-50 disabled:opacity-50"
                            >
                              <span>✕</span>
                              <span>
                                {reviewingId === proposal._id
                                  ? "Rejecting..."
                                  : "Request Revisions / Reject"}
                              </span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleReview(
                                proposal._id,
                                proposal.status === "approved"
                                  ? "rejected"
                                  : "approved"
                              )
                            }
                            disabled={reviewingId === proposal._id}
                            className="text-xs font-bold text-[#0b514a] underline hover:text-[#087f70]"
                          >
                            {proposal.status === "approved"
                              ? "Change to Rejected / Needs Revision"
                              : "Re-approve Proposal"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminProposals;
