import axios from "axios";

const API_URL =
  "http://127.0.0.1:5001/api/problems/my/problems";

export const getMyProblems = async (token) => {
  const response = await axios.get(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};


// ========================================
// DELETE MY PROBLEM
// ========================================

export const deleteMyProblem = async (
  problemId,
  token
) => {

  const response = await axios.delete(
    `http://127.0.0.1:5001/api/problems/my/${problemId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};