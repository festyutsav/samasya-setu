// ========================================
// CENTRAL API CONFIGURATION
// ========================================
// Defaults to local server during development;
// seamlessly uses VITE_API_URL or Render backend when deployed.
// Strips accidental quotes, trailing slashes, or missing schemes to prevent fatal routing errors.

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    let clean = envUrl.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = `https://${clean}`;
    }
    return clean;
  }

  // Automatic hostname detection
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "http://127.0.0.1:5001";
  }

  return "https://samasya-setu-backend.onrender.com";
};

export const API_BASE_URL = getBaseUrl();
