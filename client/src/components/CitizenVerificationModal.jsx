import React, { useState, useEffect } from "react";
import { submitCitizenFeedback } from "../services/problemService";

const RATING_LABELS = {
  1: "1★ — Poor / Did Not Solve Issue",
  2: "2★ — Incomplete / Temporary Fix",
  3: "3★ — Satisfactory / Acceptable",
  4: "4★ — Good Resolution / Functional",
  5: "5★ — Outstanding & Sustainable Impact",
};

export default function CitizenVerificationModal({
  isOpen,
  onClose,
  problem,
  onFeedbackSubmitted,
}) {
  const [activeTab, setActiveTab] = useState("verify"); // "verify" | "dispute"
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActiveTab("verify");
      setRating(5);
      setHoverRating(0);
      setComments("");
      setReopenReason("");
      setError("");
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen || !problem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to submit your feedback.");
      return;
    }

    try {
      setSubmitting(true);
      if (activeTab === "verify") {
        const result = await submitCitizenFeedback(
          problem._id,
          {
            isSatisfied: true,
            rating,
            comments: comments.trim(),
          },
          token
        );
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(result.problem || { ...problem, citizenFeedback: { isVerified: true, isSatisfied: true, rating, comments: comments.trim(), verifiedAt: new Date() } });
        }
        onClose();
      } else {
        if (!reopenReason.trim() || reopenReason.trim().length < 5) {
          setError("Please provide an explanation of at least 5 characters for disputing this closure.");
          setSubmitting(false);
          return;
        }
        const result = await submitCitizenFeedback(
          problem._id,
          {
            isSatisfied: false,
            reopenReason: reopenReason.trim(),
            comments: comments.trim(),
          },
          token
        );
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(result.problem || { ...problem, status: "under_review", resolutionSubmitted: false, citizenFeedback: { isVerified: true, isSatisfied: false, reopened: true, reopenReason: reopenReason.trim(), reopenedAt: new Date() } });
        }
        onClose();
      }
    } catch (err) {
      console.error("Submit citizen feedback error:", err);
      setError(err.response?.data?.message || "Failed to submit verification. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity"
      onClick={() => !submitting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-modal-title"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg">
              {activeTab === "verify" ? "🌟" : "⚠️"}
            </span>
            <div>
              <h3 id="verification-modal-title" className="text-base font-bold text-white">
                Citizen Resolution Verification
              </h3>
              <p className="text-xs text-emerald-100 line-clamp-1">
                {problem.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab("verify"); setError(""); }}
            className={`flex-1 py-3 text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === "verify"
                ? "border-b-2 border-emerald-600 bg-white text-emerald-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>✓</span> Confirm Resolution & Rate
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("dispute"); setError(""); }}
            className={`flex-1 py-3 text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === "dispute"
                ? "border-b-2 border-amber-600 bg-white text-amber-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>⚠️</span> Issue Still Unresolved / Dispute
          </button>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
              {error}
            </div>
          )}

          {activeTab === "verify" ? (
            <>
              {/* STAR RATING */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Rate Ground Quality & Resolution
                </label>
                <p className="mt-0.5 text-xs text-slate-500">
                  How satisfied are you with how your community's grievance was addressed?
                </p>

                <div className="mt-3 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className={`h-8 w-8 transition ${
                          star <= displayRating
                            ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                            : "fill-none stroke-slate-300 text-slate-300"
                        }`}
                        strokeWidth="1.5"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  ))}
                </div>

                <p className="mt-2 text-xs font-bold text-emerald-800">
                  {RATING_LABELS[displayRating] || ""}
                </p>
              </div>

              {/* COMMENTS */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Citizen Feedback / Ground Remarks (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share details about the fix (e.g. 'Clean drinking water is restored, working pump installed and tested by villagers')."
                  rows={3}
                  maxLength={1000}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <p className="mt-1 text-[11px] text-slate-400 text-right">
                  {comments.length} / 1000 characters
                </p>
              </div>
            </>
          ) : (
            <>
              {/* DISPUTE NOTICE */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
                <p className="font-bold text-amber-950">
                  Ground Truth Verification Clause
                </p>
                <p className="mt-1">
                  Submitting a dispute immediately revokes the "Solved" status and flags this grievance for urgent re-inspection by the Government Administrator and University field team.
                </p>
              </div>

              {/* REOPEN REASON */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Explain What Is Still Unresolved *
                </label>
                <textarea
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Explain why the problem is not fixed (e.g. 'Water pipe was left unconnected to main reservoir and still leaks at village entrance')."
                  rows={4}
                  required
                  maxLength={1000}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
                <p className="mt-1 text-[11px] text-slate-400 text-right">
                  {reopenReason.length} / 1000 characters (minimum 5)
                </p>
              </div>
            </>
          )}

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            {activeTab === "verify" ? (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Confirm & Submit Rating"}
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition disabled:opacity-50"
              >
                {submitting ? "Submitting Dispute..." : "Submit Dispute & Reopen"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
