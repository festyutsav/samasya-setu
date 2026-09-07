import { useEffect, useState } from "react";
import {
  getProposalsForProblem,
  getAllProposals,
  getMyProposals,
  reviewProposal,
} from "../services/proposalService";
import EmptyState from "./EmptyState";
import ProposalReviewModal from "./ProposalReviewModal";

// ========================================
// PROPOSAL LIST
// ========================================
// Shows proposals submitted for a problem (Admin)
// or proposals submitted by the logged-in university partner.

const ProposalList = ({
  isAdmin = false,
  problemId,
  onProposalReviewed,
}) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewModalState, setReviewModalState] = useState({
    isOpen: false,
    proposal: null,
    action: "approve",
  });

  // ========================================
  // FETCH PROPOSALS
  // ========================================

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login first.");
        setMessageType("error");
        return;
      }

      let data;

      if (isAdmin) {
        if (problemId) {
          data = await getProposalsForProblem(problemId, token);
        } else {
          data = await getAllProposals(token);
        }
      } else {
        data = await getMyProposals(token);
      }

      setProposals(data.proposals || []);
    } catch (error) {
      console.error("Fetch proposals error:", error);
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch proposals."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [isAdmin, problemId]);

  // ========================================
  // REVIEW PROPOSAL (ADMIN)
  // ========================================

  const openReviewModal = (proposal, action) => {
    setReviewModalState({
      isOpen: true,
      proposal,
      action,
    });
  };

  const handleConfirmReview = async (reviewNotes) => {
    const { proposal, action } = reviewModalState;
    if (!proposal) return;

    try {
      setReviewingId(proposal._id);
      setMessage("");

      const token = localStorage.getItem("token");

      await reviewProposal(
        proposal._id,
        action,
        reviewNotes?.trim() || "",
        token,
      );

      setMessage(`Proposal ${action === "approve" ? "approved" : "rejected"} successfully.`);
      setMessageType("success");
      setReviewModalState({ isOpen: false, proposal: null, action: "approve" });

      await fetchProposals();

      if (onProposalReviewed) {
        onProposalReviewed(proposal._id, action);
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to review proposal."
      );
      setMessageType("error");
    } finally {
      setReviewingId(null);
    }
  };

  // ========================================
  // FORMAT STATUS
  // ========================================

  const formatStatus = (status) => {
    if (!status) return "";

    return status
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  };

  const statusStyles = {
    draft: "bg-slate-100 text-slate-700",
    submitted: "bg-amber-100 text-amber-800 border border-amber-300",
    under_review: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    approved: "bg-green-100 text-green-800 border border-green-300",
    rejected: "bg-red-100 text-red-800 border border-red-300",
  };

  // ========================================
  // ERROR STATE
  // ========================================

  if (!loading && message && messageType === "error" && proposals.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-red-800">
          {isAdmin ? "Solution Proposals" : "My Proposals"}
        </h2>
        <p className="mt-2 text-sm text-red-700">{message}</p>
        <button
          type="button"
          onClick={fetchProposals}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          ↻ Retry Fetching Proposals
        </button>
      </div>
    );
  }

  // ========================================
  // EMPTY STATE
  // ========================================

  if (!loading && proposals.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="h-8 w-8 text-[#087f70]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
        title={isAdmin ? "No Solution Proposals Yet" : "No Submitted Proposals"}
        description={
          isAdmin
            ? "No university proposals have been submitted for this problem yet. When an institution submits an R&D solution plan, it will appear here for review."
            : "Your university has not submitted any solution proposals yet. Select an assigned challenge to formulate and submit a proposal."
        }
      />
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="rounded-2xl border border-[#e3e9e3] bg-white shadow-sm">
      <div className="border-b border-[#e3e9e3] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[#173d3a]">
              {isAdmin ? "Solution Proposals" : "My Proposals"}
            </h2>

            <p className="mt-1 text-sm text-[#71827c]">
              {proposals.length} proposal{proposals.length !== 1 ? "s" : ""}{" "}
              {isAdmin ? "received for this problem" : "submitted by your institution"}
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={fetchProposals}
              disabled={loading}
              className="rounded-lg border border-[#dbe5df] px-3 py-1.5 text-xs font-semibold text-[#315d56] transition hover:bg-[#f7f8f5]"
            >
              ↻ Refresh
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`mx-6 mt-4 rounded-xl border p-4 text-sm ${
            messageType === "success"
              ? "border-[#bcd9cf] bg-[#e9f4f0] text-[#087f70]"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-[#71827c]">
          Loading proposals...
        </div>
      ) : (
        <div className="divide-y divide-[#eef2ee]">
          {proposals.map((proposal) => (
            <div key={proposal._id} className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-[#173d3a]">
                      {proposal.title}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                        statusStyles[proposal.status] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {formatStatus(proposal.status)}
                    </span>
                  </div>

                  {/* University Submitter Tag */}
                  {proposal.university && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eaf4f1] px-3 py-1 text-xs font-bold text-[#0b6b60]">
                        🏛️ {proposal.university.name}
                      </span>
                      {proposal.university.location && (
                        <span className="text-xs text-[#71827c]">
                          📍 {proposal.university.location}
                        </span>
                      )}
                      {proposal.submittedBy?.name && (
                        <span className="text-xs text-[#71827c]">
                          · Submitted by {proposal.submittedBy.name}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="mt-3 text-sm leading-relaxed text-[#5c6f69]">
                    {proposal.description}
                  </p>

                  <div className="mt-3 rounded-xl border border-[#e3e9e3] bg-[#f9faf8] p-3.5 text-sm text-[#4b5e58]">
                    <p className="font-semibold text-[#173d3a]">
                      Proposed Methodology & Technical Approach:
                    </p>
                    <p className="mt-1 whitespace-pre-line text-xs sm:text-sm text-[#5c6f69]">
                      {proposal.approach}
                    </p>
                  </div>

                  {proposal.team && proposal.team.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#315d56]">
                        Project Team Members
                      </p>

                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {proposal.team.map((member, index) => (
                          <span
                            key={index}
                            className="rounded-lg border border-[#dbe5df] bg-white px-3 py-1 text-xs font-medium text-[#4b5e58] shadow-2xs"
                          >
                            👤 {member.name} {member.role ? `(${member.role})` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {proposal.reviewNotes && (
                    <div className="mt-3 rounded-xl border border-[#dbe5df] bg-[#f2f5f1] p-3 text-sm text-[#5c6f69]">
                      <p className="font-semibold text-[#315d56]">
                        Government Review Notes
                      </p>
                      <p className="mt-1 text-xs sm:text-sm">{proposal.reviewNotes}</p>
                    </div>
                  )}

                  <p className="mt-3 text-xs text-[#71827c]">
                    Submitted on{" "}
                    {proposal.createdAt
                      ? new Date(proposal.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Unknown date"}
                  </p>
                </div>
              </div>

              {/* ADMIN ACTIONS */}

              {isAdmin && proposal.status === "submitted" && (
                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-[#b9d3c9] bg-[#eef7f4] p-4">
                  <span className="text-xs font-semibold text-[#0b6b60]">
                    Government Admin Review:
                  </span>

                  <button
                    type="button"
                    onClick={() => openReviewModal(proposal, "approved")}
                    disabled={reviewingId === proposal._id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b6b60] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#087f70] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {reviewingId === proposal._id ? "Approving..." : "Approve Proposal"}
                  </button>

                  <button
                    type="button"
                    onClick={() => openReviewModal(proposal, "rejected")}
                    disabled={reviewingId === proposal._id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-2xs transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {reviewingId === proposal._id ? "Rejecting..." : "Reject Proposal"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PROPOSAL REVIEW MODAL */}
      <ProposalReviewModal
        isOpen={reviewModalState.isOpen}
        onClose={() =>
          setReviewModalState({ isOpen: false, proposal: null, action: "approve" })
        }
        onConfirm={handleConfirmReview}
        proposal={reviewModalState.proposal}
        action={reviewModalState.action === "approved" ? "approve" : "reject"}
        isLoading={Boolean(reviewingId)}
      />
    </div>
  );
};

export default ProposalList;
