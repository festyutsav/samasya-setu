// ============================================================
// SamasyaSetu — Rural Offline IndexedDB Queue Utility
// ============================================================
// Enables citizens and field workers in remote Jharkhand blocks
// with zero connectivity to record problem submissions locally.
// Stores native Blobs / Files and auto-syncs when online.

const DB_NAME = "SamasyaSetuOfflineDB";
const DB_VERSION = 1;
const STORE_NAME = "offline_submissions";

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported on this browser."));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

/**
 * Save a problem submission to the offline outbox
 */
export const saveOfflineProblem = async (problemData) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...problemData,
    };

    const request = store.add(record);

    request.onsuccess = () => resolve(record);
    request.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Get all queued offline submissions
 */
export const getOfflineProblems = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Delete a submission from the offline outbox after successful sync
 */
export const removeOfflineProblem = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
};

/**
 * Get count of pending offline submissions
 */
export const getOfflineCount = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const countRequest = store.count();

      countRequest.onsuccess = () => resolve(countRequest.result || 0);
      countRequest.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
};

/**
 * Synchronize the entire offline queue with the backend
 */
export const syncOfflineQueue = async (createProblemFn) => {
  const queue = await getOfflineProblems();
  if (!queue.length) return { syncedCount: 0, failedCount: 0 };

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    try {
      const formData = new FormData();
      formData.append("title", item.formData.title || "");
      formData.append("description", item.formData.description || "");
      formData.append("category", item.formData.category || "other");
      formData.append("location", item.formData.location || "Jharkhand");
      formData.append(
        "locationDetails",
        JSON.stringify(item.formData.locationDetails || {})
      );
      formData.append(
        "affectedPeople",
        String(Number(item.formData.affectedPeople) || 0)
      );
      formData.append("severity", item.formData.severity || "medium");

      if (item.formData.submitterType) {
        formData.append("submitterType", item.formData.submitterType);
      }

      // Append attached media files
      if (Array.isArray(item.images)) {
        item.images.forEach((img) => formData.append("images", img));
      }

      if (item.video) {
        formData.append("videos", item.video);
      }

      if (Array.isArray(item.documents)) {
        item.documents.forEach((doc) => formData.append("documents", doc));
      }

      // Attempt upload to backend
      const token = item.token || localStorage.getItem("token");
      await createProblemFn(formData, token);

      // Remove from outbox
      await removeOfflineProblem(item.id);
      syncedCount += 1;
    } catch (err) {
      console.warn(`Failed to sync offline item ${item.id}:`, err);
      failedCount += 1;
    }
  }

  // Dispatch custom window event so UI badges update
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("samasya-offline-synced", {
        detail: { syncedCount, failedCount },
      })
    );
  }

  return { syncedCount, failedCount };
};
