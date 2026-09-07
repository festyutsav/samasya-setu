// ========================================
// AUTH STORAGE HELPER & PER-TAB SESSION BRIDGE
// ========================================
// Provides strict tab-isolated authentication sessions so that multiple
// dashboards (e.g. Government, University, Industry, Citizen) can run
// simultaneously across different Chrome tabs without 403 Forbidden errors,
// portal jumping, or token collision.

const AUTH_KEYS = new Set(["token", "user"]);

/**
 * Get current auth token for this specific tab.
 */
export const getAuthToken = () => {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem("token") || null;
  } catch {
    return null;
  }
};

/**
 * Get current auth user object for this specific tab.
 */
export const getAuthUser = () => {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Failed to parse auth user:", error);
    return null;
  }
};

/**
 * Set active auth session for this tab.
 * Strictly stored in sessionStorage so other browser tabs are never overwritten.
 */
export const setAuthSession = (token, user) => {
  try {
    if (typeof window === "undefined") return;
    const userStr = typeof user === "string" ? user : JSON.stringify(user);
    window.sessionStorage.setItem("token", token);
    window.sessionStorage.setItem("user", userStr);
  } catch (error) {
    console.error("Failed to set auth session:", error);
  }
};

/**
 * Clear auth session for current tab only.
 * Other open tabs remain completely unaffected.
 */
export const clearAuthSession = () => {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem("token");
    window.sessionStorage.removeItem("user");
  } catch (error) {
    console.error("Failed to clear auth session:", error);
  }
};

/**
 * Install transparent Per-Tab Session Storage Bridge:
 * Overrides Storage.prototype on window.localStorage so that any component
 * in the entire codebase querying or setting `localStorage.getItem("token")`
 * or `localStorage.getItem("user")` is safely routed to this tab's isolated
 * sessionStorage.
 */
export const installAuthStorageBridge = () => {
  if (typeof window === "undefined" || !window.Storage) return;

  if (window.__samasya_auth_bridge_installed__) return;
  window.__samasya_auth_bridge_installed__ = true;

  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  // One-time legacy migration from localStorage to this tab's sessionStorage
  try {
    const legacyToken = originalGetItem.call(window.localStorage, "token");
    const legacyUser = originalGetItem.call(window.localStorage, "user");
    if (legacyToken && !window.sessionStorage.getItem("token")) {
      window.sessionStorage.setItem("token", legacyToken);
      if (legacyUser) {
        window.sessionStorage.setItem("user", legacyUser);
      }
      // Purge from global localStorage so newly opened tabs start clean
      originalRemoveItem.call(window.localStorage, "token");
      originalRemoveItem.call(window.localStorage, "user");
    }
  } catch {}

  // Intercept getItem: strictly read from this tab's sessionStorage for auth keys
  Storage.prototype.getItem = function (key) {
    if (this === window.localStorage && AUTH_KEYS.has(key)) {
      try {
        const sessionVal = window.sessionStorage.getItem(key);
        return sessionVal !== null && sessionVal !== undefined ? sessionVal : null;
      } catch {
        return null;
      }
    }
    return originalGetItem.apply(this, arguments);
  };

  // Intercept setItem: strictly write to this tab's sessionStorage for auth keys
  Storage.prototype.setItem = function (key, value) {
    if (this === window.localStorage && AUTH_KEYS.has(key)) {
      try {
        window.sessionStorage.setItem(key, value);
      } catch {}
      return; // Never pollute global localStorage
    }
    return originalSetItem.apply(this, arguments);
  };

  // Intercept removeItem: strictly remove from this tab's sessionStorage for auth keys
  Storage.prototype.removeItem = function (key) {
    if (this === window.localStorage && AUTH_KEYS.has(key)) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {}
      return;
    }
    return originalRemoveItem.apply(this, arguments);
  };
};

// Automatically install bridge on import
installAuthStorageBridge();
