import axios from "axios";

const API_URL =
  "http://127.0.0.1:5001/api/problems";


// ========================================
// CREATE PROBLEM
// ========================================

export const createProblem = async (
  problemData,
  token
) => {

  const response =
    await axios.post(
      API_URL,
      problemData,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


  return response.data;
};


// ========================================
// GET ALL PROBLEMS
// ========================================

export const getAllProblems = async (
  token
) => {

  const response =
    await axios.get(
      API_URL,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


  return response.data;
};


// ========================================
// GET MY PROBLEMS
// ========================================

export const getMyProblems = async (
  token
) => {

  const response =
    await axios.get(
      `${API_URL}/my/problems`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


  return response.data;
};


// ========================================
// GET SINGLE PROBLEM
// ========================================

export const getProblemById = async (
  problemId,
  token
) => {

  const response =
    await axios.get(
      `${API_URL}/${problemId}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );


  return response.data;
};