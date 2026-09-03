import { useEffect, useState } from "react";

import { getMyProposals, reviewProposal } from "../services/proposalService";

// ========================================
// PROPOSAL LIST
// ========================================
// Shows proposals submitted by the logged-in
// university partner.

const ProposalList = ({ isAdmin = false, problemId }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [reviewingId, setReviewingId] = useState(null);

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

      if (isAdmin && problemId) {
        const response = await fetch(
          `http://127.0.0.1:5001/api/proposals/problem/${problemId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.message || "Failed to fetch proposals.");
        }

        data = json;
      } else {
        data = await getMyProposals(token);
      }

      setProposals(data.proposals || []);
    } catch (error) {
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
  // REVIEW PROPOSAL
  // ========================================

  const handleReview = async (proposalId, status) => {
    try {
      setReviewingId(proposalId);
      setMessage("");

      const token = localStorage.getItem("token");

      const reviewNotes = prompt(
        status === "approved"
          ? "Enter approval notes (optional):"
          : "Enter rejection reason (optional):"
      );

      await reviewProposal(proposalId, status, reviewNotes || "", token);

      setMessage(`Proposal ${status} successfully.`);
      setMessageType("success");

      fetchProposals();
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
    submitted: "bg-blue-100 text-blue-700",
    under_review: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  // ========================================
  // EMPTY STATE
  // ========================================

  if (!loading && proposals.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#173d3a]">
          {isAdmin ? "Proposals" : "My Proposals"}
        </h2>

        <p className="mt-2 text-sm text-[#71827c]">
          {isAdmin
            ? "No proposals have been submitted for this problem yet."
            : "You have not submitted any proposals yet."}
        </p>
      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="rounded-2xl border border-[#e3e9e3] bg-white shadow-sm">
      <div className="border-b border-[#e3e9e3] p-6">
        <h2 className="text-xl font-bold text-[#173d3a]">
          {isAdmin ? "Proposals" : "My Proposals"}
        </h2>

        <p className="mt-1 text-sm text-[#71827c]">
          {proposals.length} proposal
          {proposals.length !== 1 ? "s" : ""}
        </p>
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
            <div
              key={proposal._id}
              className="p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-[#173d3a]">
                      {proposal.title}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[proposal.status] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {formatStatus(proposal.status)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[#5c6f69]">
                    {proposal.description}
                  </p>

                  <p className="mt-2 text-sm text-[#5c6f69]">
                    <span className="font-semibold">Approach:</span>{" "}
                    {proposal.approach}
                  </p>

                  {proposal.team && proposal.team.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-[#315d56]">
                        Team Members
                      </p>

                      <div className="mt-1 flex flex-wrap gap-2">
                        {proposal.team.map((member, index) => (
                          <span
                            key={index}
                            className="rounded-lg bg-[#f2f5f1] px-3 py-1 text-xs text-[#5c6f69]"
                          >
                            {member.name} ({member.role})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {proposal.reviewNotes && (
                    <div className="mt-3 rounded-lg bg-[#f2f5f1] p-3 text-sm text-[#5c6f69]">
                      <p className="font-semibold text-[#315d56]">
                        Review Notes
                      </p>
                      <p className="mt-1">{proposal.reviewNotes}</p>
                    </div>
                  )}

                  <p className="mt-3 text-xs text-[#71827c]">
                    Submitted on{" "}
                    {proposal.createdAt
                      ? new Date(proposal.createdAt).toLocaleDateString()
                      : "Unknown date"}
                  </p>
                </div>
              </div>

              {/* ADMIN ACTIONS */}

              {isAdmin && proposal.status !== "approved" && proposal.status !== "rejected" && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      handleReview(proposal._id, "approved")
                    }
                    disabled={reviewingId === proposal._id}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reviewingId === proposal._id
                      ? "Approving..."
                      : "Approve"}
                  </button>

                  <button
                    onClick={() =>
                      handleReview(proposal._id, "rejected")
                    }
                    disabled={reviewingId === proposal._id}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reviewingId === proposal._id
                      ? "Rejecting..."
                      : "Reject"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposalList;
