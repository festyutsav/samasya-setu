import React from "react";

export default function EmptyState({
  icon,
  title = "Nothing to display",
  description = "There are no items matching this criteria at this time.",
  actionText,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#cfe0d8] bg-gradient-to-b from-white to-[#fbfdfc] p-10 sm:p-14 text-center shadow-xs transition-all ${className}`}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e1f1ed] text-2xl text-[#087f70] shadow-sm">
        {icon || (
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[#173d3a]">
        {title}
      </h3>

      {description && (
        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-[#5c6f69] leading-relaxed">
          {description}
        </p>
      )}

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#087f70] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-[#066a5d] active:scale-[0.98]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
