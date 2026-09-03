import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/api/problems/my/problems`;

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
    `${API_BASE_URL}/api/problems/my/${problemId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};