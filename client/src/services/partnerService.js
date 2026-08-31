import axios from "axios";

// ========================================
// API URLS
// ========================================

const PARTNER_API_URL =
  "http://127.0.0.1:5001/api/partners";

const PROBLEM_API_URL =
  "http://127.0.0.1:5001/api/problems";


// ========================================
// AUTH CONFIG
// ========================================

const getAuthConfig = (token) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};


// ========================================
// CREATE PARTNER
// ADMIN ONLY
// ========================================

export const createPartner = async (
  partnerData,
  token,
) => {
  const response = await axios.post(
    PARTNER_API_URL,
    partnerData,
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// GET ALL PARTNERS
// ADMIN ONLY
// ========================================

export const getAllPartners = async (
  token,
) => {
  const response = await axios.get(
    PARTNER_API_URL,
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// GET SINGLE PARTNER
// ADMIN ONLY
// ========================================

export const getPartnerById = async (
  partnerId,
  token,
) => {
  const response = await axios.get(
    `${PARTNER_API_URL}/${partnerId}`,
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// DELETE PARTNER
// ADMIN ONLY
// ========================================

export const deletePartner = async (
  partnerId,
  token,
) => {
  const response = await axios.delete(
    `${PARTNER_API_URL}/${partnerId}`,
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// GET PARTNER DASHBOARD
// PARTNER ONLY
// ========================================

export const getPartnerDashboard = async (
  token,
) => {
  const response = await axios.get(
    `${PROBLEM_API_URL}/partner/dashboard`,
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// GET PARTNER ASSIGNED PROBLEMS
// PARTNER ONLY
// ========================================

export const getPartnerProblems = async (
  token,
) => {
  const response = await axios.get(
    `${PROBLEM_API_URL}/partner/problems`,
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// UPDATE PARTNER PROBLEM STATUS
// PARTNER ONLY
// ========================================

export const updatePartnerProblemStatus = async (
  problemId,
  status,
  token,
) => {
  const response = await axios.patch(
    `${PROBLEM_API_URL}/partner/problems/${problemId}/status`,
    {
      status,
    },
    getAuthConfig(token),
  );

  return response.data;
};