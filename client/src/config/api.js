// ========================================
// CENTRAL API CONFIGURATION
// ========================================
// Defaults to local server during development;
// seamlessly uses VITE_API_URL when deployed (e.g. Render/Vercel/Railway).

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:5001";
