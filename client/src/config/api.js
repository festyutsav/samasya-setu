// ========================================
// CENTRAL API CONFIGURATION
// ========================================
// Defaults to local server during development;
// seamlessly uses VITE_API_URL when deployed (e.g. Render/Vercel/Railway).

// API Base URL
// Vercel: set VITE_API_URL to your Render backend URL
// Local: set VITE_API_URL=http://127.0.0.1:5001 in client/.env

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://samasya-setu-backend.onrender.com";