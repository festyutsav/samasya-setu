// ========================================
// CENTRAL API CONFIGURATION
// ========================================
// Defaults to local server during development;
// seamlessly uses VITE_API_URL or Render backend when deployed.

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:5001"
    : "https://samasya-setu-backend.onrender.com");
