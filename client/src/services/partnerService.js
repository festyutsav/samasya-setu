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


// ========================================
// PROJECT API (UNIVERSITY PARTNERS)
// ========================================

const PROJECT_API_URL =
  "http://127.0.0.1:5001/api/projects";


// ========================================
// CREATE PROJECT
// UNIVERSITY PARTNER ONLY
// ========================================

export const createProject = async (
  projectData,
  token,
) => {
  const response = await axios.post(
    PROJECT_API_URL,
    projectData,
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// GET MY PROJECTS
// PARTNER ONLY
// ========================================

export const getMyProjects = async (
  token,
) => {
  const response = await axios.get(
    `${PROJECT_API_URL}/mine`,
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// UPDATE PROJECT STATUS
// PARTNER ONLY
// ========================================

export const updateProjectStatus = async (
  projectId,
  status,
  token,
) => {
  const response = await axios.patch(
    `${PROJECT_API_URL}/${projectId}/status`,
    {
      status,
    },
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// TOGGLE PROJECT MILESTONE
// PARTNER ONLY
// ========================================

export const toggleProjectMilestone = async (
  projectId,
  milestoneIndex,
  token,
) => {
  const response = await axios.patch(
    `${PROJECT_API_URL}/${projectId}/milestones`,
    {
      milestoneIndex,
    },
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// PARTNER DIRECTORY
// PARTNER ONLY
// ========================================
// Used by universities to pick industry partners when
// inviting collaborators onto a project.

export const getPartnerDirectory = async (token) => {
  const response = await axios.get(
    `${PARTNER_API_URL}/directory`,
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// INVITE COLLABORATOR
// LEAD UNIVERSITY ONLY
// ========================================

export const inviteCollaborator = async (
  projectId,
  partnerId,
  role,
  token,
) => {
  const response = await axios.post(
    `${PROJECT_API_URL}/${projectId}/collaborators`,
    {
      partnerId,
      role,
    },
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// RESPOND TO COLLABORATION INVITE
// INVITED PARTNER ONLY
// ========================================

export const respondToCollaboration = async (
  projectId,
  collaboratorId,
  response,
  token,
) => {
  const res = await axios.patch(
    `${PROJECT_API_URL}/${projectId}/collaborators/${collaboratorId}`,
    {
      response,
    },
    getAuthConfig(token),
  );

  return res.data;
};


// ========================================
// WITHDRAW COLLABORATOR
// LEAD UNIVERSITY ONLY
// ========================================

export const withdrawCollaborator = async (
  projectId,
  collaboratorId,
  token,
) => {
  const response = await axios.delete(
    `${PROJECT_API_URL}/${projectId}/collaborators/${collaboratorId}`,
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// ADD COLLABORATION CONTRIBUTION
// ACCEPTED COLLABORATOR ONLY
// ========================================

export const addCollaborationContribution = async (
  projectId,
  collaboratorId,
  contribution,
  token,
) => {
  const response = await axios.post(
    `${PROJECT_API_URL}/${projectId}/collaborators/${collaboratorId}/contributions`,
    contribution,
    getAuthConfig(token),
  );

  return response.data;
};