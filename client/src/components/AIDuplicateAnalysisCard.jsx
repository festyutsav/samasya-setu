import { useState } from "react";

import {
  reviewAiDuplicate,
  reanalyzeDuplicates,
} from "../services/adminService";

// ========================================
// AI DUPLICATE ANALYSIS CARD
// ========================================
// Shows the duplicate/recurring candidates the AI suggested
// for a problem and lets the admin confirm or reject them.
//
// The AI only suggests. Nothing is marked as a duplicate
// until an admin acts here.

const reviewLabels = {
  confirmed_duplicate: "Confirmed as a duplicate",
  marked_recurring: "Marked as a recurring issue",
  confirmed_separate: "Confirmed as a separate problem",
};

const reviewStyles = {
  confirmed_duplicate: "border-red-200 bg-red-50 text-red-800",
  marked_recurring: "border-[#d5c9ea] bg-[#f0ecf8] text-[#463872]",
  confirmed_separate: "border-[#bcd9cf] bg-[#e9f4f0] text-[#0a4f47]",
};

const AIDuplicateAnalysisCard = ({
  candidateMatches,
  problemId,
  aiReviewStatus,
  parentProblem,
  analyzedAt,
  onReviewComplete,
}) => {
  // One busy key for every action on this card, so actions that carry
  // no candidate id (reopen, re-run) still disable the buttons and show
  // progress. Keying on candidate id alone left those actions invisible
  // and double-submittable.
  const [busy, setBusy] = useState(null);

  const isBusy = busy !== null;

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("success");

  const isReviewed = aiReviewStatus && aiReviewStatus !== "pending";

  // ========================================
  // AI REVIEW ACTION
  // ========================================

  const reviewKey = (action, candidateId) =>
    `${action}:${candidateId ?? "none"}`;

  const handleAiReview = async (candidateId, action) => {
    try {
      setBusy(reviewKey(action, candidateId));

      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessageType("error");

        setMessage("Authentication token not found. Please login again.");

        return;
      }

      const data = await reviewAiDuplicate(
        problemId,
        action,
        candidateId,
        token,
      );

      setMessageType("success");

      setMessage(
        action === "confirm_duplicate"
          ? "Marked as Duplicate successfully."
          : action === "confirm_recurring"
            ? "Marked as Recurring successfully."
            : action === "reopen_review"
              ? data.message || "Review reopened."
              : "Kept as a separate problem."
      );

      if (onReviewComplete) {
        await onReviewComplete();
      }
    } catch (error) {
      console.error("AI review error:", error);

      setMessageType("error");

      setMessage(
        error.response?.data?.message || "Failed to update AI review."
      );
    } finally {
      setBusy(null);
    }
  };

  // ========================================
  // RE-RUN ANALYSIS
  // ========================================
  // Needed for problems submitted before duplicate detection
  // existed, and to pick up reports filed nearby since.

  const handleReanalyze = async () => {
    try {
      // Re-running keeps any existing decision, but an admin clicking
      // this on a reviewed problem is usually trying to change it — say
      // what will and won't happen instead of looking like a no-op.
      if (isReviewed) {
        const proceed = window.confirm(
          "This problem has already been reviewed. Re-running the analysis refreshes the AI's suggestions but keeps your existing decision. To change the decision, use \"Reopen review\" instead.\n\nRe-run the analysis anyway?"
        );

        if (!proceed) return;
      }

      setBusy("reanalyze");

      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMessageType("error");

        setMessage("Authentication token not found. Please login again.");

        return;
      }

      const data = await reanalyzeDuplicates(problemId, token);

      setMessageType("success");

      setMessage(data.message || "Duplicate analysis complete.");

      if (onReviewComplete) {
        await onReviewComplete();
      }
    } catch (error) {
      console.error("Re-analyze error:", error);

      setMessageType("error");

      setMessage(
        error.response?.data?.message || "Failed to run duplicate analysis."
      );
    } finally {
      setBusy(null);
    }
  };

  // ========================================
  // FORMAT STATUS
  // ========================================

  const formatStatus = (status) => {
    if (!status) return "";

    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // ========================================
  // SHARED HEADER
  // ========================================

  const header = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-[#173d3a]">
          AI Duplicate &amp; Recurring Analysis
        </h2>

        {analyzedAt && (
          <p className="mt-1 text-xs text-[#71827c]">
            Last analysed {new Date(analyzedAt).toLocaleString()}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleReanalyze}
        disabled={isBusy}
        className="rounded-lg border border-[#dbe5df] bg-white px-4 py-2 text-sm font-semibold text-[#315d56] transition hover:bg-[#f2f5f1] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy === "reanalyze" ? "Analysing..." : "Re-run analysis"}
      </button>
    </div>
  );

  const messageBanner = message && (
    <div
      className={`mb-4 rounded-xl border p-3 text-sm ${
        messageType === "success"
          ? "border-[#bcd9cf] bg-[#e9f4f0] text-[#087f70]"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {message}
    </div>
  );

  // ========================================
  // ALREADY REVIEWED
  // ========================================
  // Show the decision instead of re-offering the same buttons, plus a
  // way back out of it. Without the reopen control this branch is a
  // dead end — the candidate list stays hidden for good.

  if (isReviewed) {
    return (
      <div className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
        {header}

        {messageBanner}

        <div
          className={`rounded-xl border p-5 ${
            reviewStyles[aiReviewStatus] ||
            "border-[#e3e9e3] bg-[#f2f5f1] text-[#315d56]"
          }`}
        >
          <p className="font-semibold">
            {reviewLabels[aiReviewStatus] || formatStatus(aiReviewStatus)}
          </p>

          {parentProblem?.title && (
            <p className="mt-2 text-sm">
              Linked to:{" "}
              <span className="font-semibold">{parentProblem.title}</span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleAiReview(null, "reopen_review")}
          disabled={isBusy}
          className="mt-4 text-sm font-semibold text-[#0b6b60] transition hover:text-[#087f70] disabled:opacity-60"
        >
          {busy === reviewKey("reopen_review", null)
            ? "Reopening..."
            : "Reopen review — show the AI suggestions again"}
        </button>
      </div>
    );
  }

  // ========================================
  // EMPTY STATE
  // ========================================

  if (!candidateMatches || candidateMatches.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
        {header}

        {messageBanner}

        <div className="rounded-xl border border-[#e3e9e3] bg-[#f2f5f1] p-5">
          <p className="text-sm text-[#71827c]">
            No duplicate or recurring candidates found within 5 km of this
            problem.
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // CANDIDATE LIST
  // ========================================

  return (
    <div className="rounded-2xl border border-[#e3e9e3] bg-white p-6 shadow-sm">
      {header}

      {messageBanner}

      <div className="grid gap-4">
        {candidateMatches.map((candidate) => {
          const matchScorePercent = Math.round(
            (candidate.matchScore || 0) * 100
          );

          const isRecurring = candidate.matchType === "Recurring";

          const confirmAction = isRecurring
            ? "confirm_recurring"
            : "confirm_duplicate";

          const confirmKey = reviewKey(confirmAction, candidate._id);

          const separateKey = reviewKey("keep_separate", candidate._id);

          return (
            <div
              key={candidate._id}
              className="rounded-xl border border-[#e3e9e3] p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#173d3a]">
                    {candidate.title}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {/* MATCH SCORE */}

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        matchScorePercent >= 80
                          ? "bg-red-100 text-red-700"
                          : matchScorePercent >= 70
                            ? "bg-[#f7ebd8] text-[#a25a1b]"
                            : "bg-[#f7f8f5] text-[#5c6f69]"
                      }`}
                    >
                      Match Score: {matchScorePercent}%
                    </span>

                    {/* MATCH TYPE */}

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isRecurring
                          ? "bg-[#e5dcf2] text-[#564680]"
                          : "bg-[#fbe5d8] text-[#b05c2d]"
                      }`}
                    >
                      {isRecurring
                        ? "Possible Recurring Issue"
                        : "Possible Duplicate"}
                    </span>

                    {/* STATUS */}

                    <span className="rounded-full bg-[#f7f8f5] px-3 py-1 text-xs font-semibold capitalize text-[#5c6f69]">
                      {formatStatus(candidate.status)}
                    </span>

                    {/* CATEGORY */}

                    {candidate.category && (
                      <span className="rounded-full bg-[#e9f4f0] px-3 py-1 text-xs font-semibold capitalize text-[#0b6b60]">
                        {candidate.category}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-[#5c6f69]">
                    {candidate.description?.slice(0, 200)}
                    {candidate.description?.length > 200 && "..."}
                  </p>
                </div>
              </div>

              {/* SCORE BREAKDOWN */}

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#eef2ee] pt-4 text-sm sm:grid-cols-4">
                <ScoreCell
                  label="Semantic Score"
                  value={candidate.semanticScore?.toFixed(3)}
                />

                <ScoreCell
                  label="Geo Score"
                  value={candidate.geoScore?.toFixed(3)}
                />

                <ScoreCell
                  label="Category Match"
                  value={candidate.categoryScore ? "Yes" : "No"}
                />

                <ScoreCell
                  label="Distance"
                  value={`${candidate.distanceKm?.toFixed(2)} km`}
                />
              </div>

              {/* ACTIONS */}

              <div className="mt-5 flex flex-wrap gap-3 border-t border-[#eef2ee] pt-4">
                {/* MARK AS DUPLICATE / RECURRING */}

                <button
                  type="button"
                  onClick={() =>
                    handleAiReview(candidate._id, confirmAction)
                  }
                  disabled={isBusy}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isRecurring
                      ? "bg-[#564680] hover:bg-[#463872]"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {busy === confirmKey
                    ? "Updating..."
                    : isRecurring
                      ? "Mark as Recurring"
                      : "Mark as Duplicate"}
                </button>

                {/* KEEP SEPARATE */}

                <button
                  type="button"
                  onClick={() => handleAiReview(candidate._id, "keep_separate")}
                  disabled={isBusy}
                  className="rounded-lg border border-[#dbe5df] bg-white px-4 py-2 text-sm font-semibold text-[#315d56] transition hover:bg-[#f2f5f1] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy === separateKey ? "Updating..." : "Keep Separate"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ========================================
// SCORE CELL
// ========================================

const ScoreCell = ({ label, value }) => {
  return (
    <div>
      <p className="text-[#71827c]">{label}</p>

      <p className="font-semibold text-[#173d3a]">{value ?? "—"}</p>
    </div>
  );
};

export default AIDuplicateAnalysisCard;
