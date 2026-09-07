import { useEffect, useState } from "react";

export default function ProposalReviewModal({
  isOpen,
  onClose,
  onConfirm,
  proposal,
  action = "approve", // "approve" | "reject"
  isLoading = false,
}) {
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReviewNotes("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isApprove = action === "approve";

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reviewNotes);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => {
        if (!isLoading) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div
          className={`h-2.5 w-full ${
            isApprove
              ? "bg-gradient-to-r from-emerald-500 to-teal-600"
              : "bg-gradient-to-r from-rose-500 to-amber-600"
          }`}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition disabled:opacity-40"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7">
          {/* Badge & Title */}
          <div className="flex items-start gap-3.5">
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${
                isApprove
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {isApprove ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <div className="flex-1 pr-6">
              <span
                className={`inline-block text-[11px] font-bold uppercase tracking-wider ${
                  isApprove ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                Government Admin Decision
              </span>
              <h3 className="text-lg font-bold text-[#173d3a]">
                {isApprove ? "Approve R&D Solution Proposal" : "Reject Proposal"}
              </h3>
            </div>
          </div>

          {/* Proposal Summary Card */}
          {proposal && (
            <div className="mt-4 rounded-2xl border border-[#e3e9e3] bg-[#fbfdfc] p-3.5 text-xs text-[#5c6f69] space-y-1.5">
              <p className="font-bold text-[#173d3a] line-clamp-1 text-sm">
                {proposal.title || "Solution Proposal"}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#71827c]">
                {proposal.partner?.name && (
                  <span>🏛️ {proposal.partner.name}</span>
                )}
                {proposal.budget?.amount && (
                  <span>💰 ₹{proposal.budget.amount.toLocaleString()}</span>
                )}
                {proposal.timeline?.duration && (
                  <span>⏱️ {proposal.timeline.duration}</span>
                )}
              </div>
            </div>
          )}

          {/* Review Notes Textarea */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-[#315d56] uppercase tracking-wider mb-1.5">
              {isApprove ? "Approval Notes & Guidance (Optional)" : "Reason for Rejection (Optional)"}
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
              placeholder={
                isApprove
                  ? "e.g., Recommended for departmental allocation. Phase 1 field testing approved..."
                  : "e.g., Scope requires clarification on municipal sensor maintenance..."
              }
              className="w-full rounded-xl border border-[#dbe5df] bg-[#fbfcfa] p-3 text-xs focus:border-[#087f70] focus:ring-2 focus:ring-[#e1f1ed] focus:outline-none placeholder:text-[#a1aca7]"
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-[#5c6f69] transition hover:bg-[#f7f8f5] hover:text-[#173d3a] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isApprove
                  ? "bg-[#087f70] hover:bg-[#066a5d] shadow-teal-200"
                  : "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
              }`}
            >
              {isLoading ? (
                <span>Submitting...</span>
              ) : isApprove ? (
                "Confirm Approval"
              ) : (
                "Confirm Rejection"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
