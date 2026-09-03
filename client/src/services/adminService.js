import axios from "axios";

const API_URL =
  "http://127.0.0.1:5001/api/problems";

// ================= UPDATE PROBLEM STATUS =================

export const updateProblemStatus = async (
  problemId,
  status,
  token
) => {
  const response = await axios.patch(
    `${API_URL}/${problemId}/status`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// ================= ASSIGN PARTNER TO PROBLEM =================

export const assignPartnerToProblem = async (
  problemId,
  partnerId,
  token
) => {
  const response = await axios.patch(
    `${API_URL}/${problemId}/assign-partner`,
    {
      partnerId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// ================= AI DUPLICATE REVIEW =================
// action: "confirm_duplicate" | "confirm_recurring" | "keep_separate"
// parentProblemId is required for the first two.

export const reviewAiDuplicate = async (
  problemId,
  action,
  parentProblemId,
  token
) => {
  const body = { action };

  if (
    action === "confirm_duplicate" ||
    action === "confirm_recurring"
  ) {
    body.parentProblemId = parentProblemId;
  }

  const response = await axios.patch(
    `${API_URL}/${problemId}/ai-review`,
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// ================= RE-RUN AI DUPLICATE ANALYSIS =================

export const reanalyzeDuplicates = async (
  problemId,
  token
) => {
  const response = await axios.post(
    `${API_URL}/${problemId}/duplicate-analysis`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// ================= RE-RUN AI PARTNER ROUTING =================
// Recomputes university/industry suggestions for one problem
// and returns the fully populated problem so the admin UI
// can refresh in place.

export const rerunRouting = async (
  problemId,
  token
) => {
  const response = await axios.post(
    `${API_URL}/${problemId}/rerun-routing`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// ================= DOWNLOAD PARTNER CREDENTIALS =================
// The endpoint is admin-authenticated, so a plain window.open()
// would open an unauthorized request and fail. Fetching as a
// Blob with the Bearer token and triggering a programmatic
// <a download> click works with the auth header attached.

export const downloadPartnerCredentials = async (token) => {
  const response = await axios.get(
    "http://127.0.0.1:5001/api/admin/partners/credentials",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    }
  );

  return response;
};
