const API_URL =
  "http://127.0.0.1:5001/api/proposals";

// ========================================
// CREATE PROPOSAL
// ========================================

export const createProposal = async (data, token) => {
  const response = await axios.post(API_URL, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// ========================================
// GET PROPOSALS FOR PROBLEM (ADMIN)
// ========================================

export const getProposalsForProblem = async (problemId, token) => {
  const response = await axios.get(
    `${API_URL}/problem/${problemId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// ========================================
// GET MY PROPOSALS (UNIVERSITY)
// ========================================

export const getMyProposals = async (token) => {
  const response = await axios.get(`${API_URL}/my-proposals`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// ========================================
// REVIEW PROPOSAL (ADMIN)
// ========================================

export const reviewProposal = async (proposalId, status, reviewNotes, token) => {
  const response = await axios.patch(
    `${API_URL}/${proposalId}/review`,
    { status, reviewNotes },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// ========================================
// UPDATE PROPOSAL (UNIVERSITY)
// ========================================

export const updateProposal = async (proposalId, data, token) => {
  const response = await axios.patch(
    `${API_URL}/${proposalId}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// ========================================
// DELETE PROPOSAL (UNIVERSITY)
// ========================================

export const deleteProposal = async (proposalId, token) => {
  const response = await axios.delete(
    `${API_URL}/${proposalId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};
