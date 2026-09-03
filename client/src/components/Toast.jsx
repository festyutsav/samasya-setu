import { useEffect } from "react";

export default function Toast({
  message,
  type = "success",
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";
  const isError = type === "error";

  return (
    <div
      role="alert"
      className={`fixed bottom-6 right-6 z-50 flex max-w-md items-center gap-3 rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 border ${
        isSuccess
          ? "border-[#0b6b60]/30 bg-[#f0f9f6]/95 text-[#073f3a]"
          : isError
          ? "border-red-200 bg-red-50/95 text-red-800"
          : "border-[#31527c]/30 bg-[#f0f4f8]/95 text-[#1e3450]"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isSuccess
            ? "bg-[#0b6b60] text-white"
            : isError
            ? "bg-red-600 text-white"
            : "bg-[#31527c] text-white"
        }`}
      >
        {isSuccess ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : isError ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        )}
      </div>

      <div className="flex-1 text-sm font-medium leading-snug">
        {message}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-current opacity-60 transition hover:opacity-100"
          aria-label="Dismiss notification"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
