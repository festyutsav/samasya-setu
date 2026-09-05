// ========================================
// AUTH STORAGE HELPER & PER-TAB SESSION BRIDGE
// ========================================
// Provides tab-isolated authentication sessions so that multiple
// dashboards (e.g. Government, University, Industry) can run simultaneously
// across different Chrome tabs without 403 Forbidden errors or token collision.

const AUTH_KEYS = new Set(["token", "user"]);

/**
 * Get current auth token.
 * Prioritizes tab-isolated sessionStorage, then falls back to localStorage.
 */
export const getAuthToken = () => {
  try {
    if (typeof window === "undefined") return null;
    return (
      window.sessionStorage.getItem("token") ||
      window.localStorage.getItem("token") ||
      null
    );
  } catch {
    return null;
  }
};

/**
 * Get current auth user object.
 * Prioritizes tab-isolated sessionStorage, then falls back to localStorage.
 */
export const getAuthUser = () => {
  try {
    if (typeof window === "undefined") return null;
    const raw =
      window.sessionStorage.getItem("user") ||
      window.localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to parse auth user:", error);
    return null;
  }
};

/**
 * Set active auth session.
 * Stores in sessionStorage for strict per-tab isolation.
 * Also synchronizes to localStorage as a fallback.
 */
export const setAuthSession = (token, user) => {
  try {
    if (typeof window === "undefined") return;
    const userStr = typeof user === "string" ? user : JSON.stringify(user);
    window.sessionStorage.setItem("token", token);
    window.sessionStorage.setItem("user", userStr);
    window.localStorage.setItem("token", token);
    window.localStorage.setItem("user", userStr);
  } catch (error) {
    console.error("Failed to set auth session:", error);
  }
};

/**
 * Clear auth session for current tab and clear persistent fallback.
 */
export const clearAuthSession = () => {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem("token");
    window.sessionStorage.removeItem("user");
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
  } catch (error) {
    console.error("Failed to clear auth session:", error);
  }
};

/**
 * Install transparent Per-Tab Session Storage Bridge:
 * Overrides Storage.prototype.getItem on window.localStorage so that any
 * component in this tab querying `localStorage.getItem("token")` or
 * `localStorage.getItem("user")` seamlessly receives this specific tab's
 * isolated sessionStorage value first.
 */
export const installAuthStorageBridge = () => {
  if (typeof window === "undefined" || !window.Storage) return;

  // Prevent multiple installations
  if (window.__samasya_auth_bridge_installed__) return;
  window.__samasya_auth_bridge_installed__ = true;

  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  // Intercept getItem: prioritize this tab's sessionStorage for auth keys
  Storage.prototype.getItem = function (key) {
    if (this === window.localStorage && AUTH_KEYS.has(key)) {
      try {
        const sessionVal = window.sessionStorage.getItem(key);
        if (sessionVal !== null && sessionVal !== undefined) {
          return sessionVal;
        }
      } catch {
        // Fall through on restricted access
      }
    }
    return originalGetItem.apply(this, arguments);
  };

  // Intercept setItem: mirror auth keys into tab's sessionStorage
  Storage.prototype.setItem = function (key, value) {
    if (this === window.localStorage && AUTH_KEYS.has(key)) {
      try {
        window.sessionStorage.setItem(key, value);
      } catch {}
    }
    return originalSetItem.apply(this, arguments);
  };

  // Intercept removeItem: clear tab's sessionStorage for auth keys
  Storage.prototype.removeItem = function (key) {
    if (this === window.localStorage && AUTH_KEYS.has(key)) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {}
    }
    return originalRemoveItem.apply(this, arguments);
  };
};

// Automatically install bridge on import
installAuthStorageBridge();
