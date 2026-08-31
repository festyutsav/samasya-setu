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