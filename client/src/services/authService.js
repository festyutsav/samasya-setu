import axios from "axios";
import { API_BASE_URL } from "../config/api";

const AUTH_API_URL = `${API_BASE_URL}/api/auth`;

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

// ================= SEND REGISTRATION OTP =================

export const sendRegistrationOtp = async (name, email, password) => {
  const response = await axios.post(`${AUTH_API_URL}/send-otp`, {
    name,
    email,
    password,
  });

  return response.data;
};

// ================= VERIFY OTP AND REGISTER =================

export const verifyOtpAndRegister = async (
  name,
  email,
  password,
  otp
) => {
  const response = await axios.post(
    `${AUTH_API_URL}/verify-otp-register`,
    {
      name,
      email,
      password,
      otp,
    }
  );

  return response.data;
};