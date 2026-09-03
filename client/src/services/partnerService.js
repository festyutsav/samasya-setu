import axios from "axios";
import { API_BASE_URL } from "../config/api";

// ========================================
// API URLS
// ========================================

const PARTNER_API_URL = `${API_BASE_URL}/api/partners`;
const PROBLEM_API_URL = `${API_BASE_URL}/api/problems`;


// ========================================
// AUTH CONFIG
// ========================================

const getAuthConfig = (token, params) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  if (params) {
    config.params = params;
  }

  return config;
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

const PROJECT_API_URL = `${API_BASE_URL}/api/projects`;


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
// SET MILESTONE DUE DATE
// PARTNER (LEAD UNIVERSITY) ONLY
// ========================================

export const setMilestoneDueDate = async (
  projectId,
  milestoneIndex,
  dueDate,
  token,
) => {
  const response = await axios.patch(
    `${PROJECT_API_URL}/${projectId}/milestones/due-date`,
    {
      milestoneIndex,

      dueDate,
    },
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// UPDATE INNOVATION OUTCOMES
// PARTNER (LEAD UNIVERSITY) ONLY
// ========================================
// Records measurable project outcomes — patents, startups,
// publications, deployments — for the analytics dashboard.

export const updateProjectOutcomes = async (
  projectId,
  outcomes,
  token,
) => {
  const response = await axios.patch(
    `${PROJECT_API_URL}/${projectId}/outcomes`,
    outcomes,
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// GET PARTNER DIRECTORY
// PARTNER ONLY
// ========================================
// Powers the Discover Partners page: filter by type or
// expertise, search by name, and exclude the caller's own
// organization. Response includes public activity counts and
// each university's open projects.

export const getPartnerDirectory = async (token, params = {}) => {
  const response = await axios.get(
    `${PARTNER_API_URL}/directory`,
    getAuthConfig(token, params),
  );

  return response.data;
};


// ========================================
// GET SINGLE PROJECT (SHARED WORKSPACE)
// LEAD + LIVE COLLABORATORS ONLY
// ========================================

export const getProjectById = async (projectId, token) => {
  const response = await axios.get(
    `${PROJECT_API_URL}/${projectId}`,
    getAuthConfig(token),
  );

  return response.data;
};


// ========================================
// REQUEST TO COLLABORATE
// PARTNER-INITIATED
// ========================================
// A partner asks to join a university-led project; the lead
// university accepts or declines.

export const requestCollaboration = async (
  projectId,
  role,
  message,
  token,
) => {
  const response = await axios.post(
    `${PROJECT_API_URL}/${projectId}/requests`,
    {
      role,
      message,
    },
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