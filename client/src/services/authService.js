import axios from "axios";

const AUTH_API_URL = "http://127.0.0.1:5001/api/auth";

// ================= LOGIN USER =================

export const loginUser = async (email, password) => {
  const response = await axios.post(`${AUTH_API_URL}/login`, {
    email,
    password,
  });

  return response.data;
};

// ================= REGISTER USER =================

export const registerUser = async (name, email, password) => {
  const response = await axios.post(`${AUTH_API_URL}/register`, {
    name,
    email,
    password,
  });

  return response.data;
};