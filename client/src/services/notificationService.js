import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/api/notifications`;


const authHeaders = (token) => ({
  headers: {
    Authorization:
      `Bearer ${token}`,
  },
});


// ========================================
// GET MY NOTIFICATIONS
// ========================================

export const getMyNotifications = async (
  token
) => {

  const response =
    await axios.get(
      API_URL,
      authHeaders(token)
    );


  return response.data;
};


// ========================================
// GET UNREAD COUNT
// ========================================

export const getUnreadCount = async (
  token
) => {

  const response =
    await axios.get(
      `${API_URL}/unread-count`,
      authHeaders(token)
    );


  return response.data;
};


// ========================================
// MARK ONE AS READ
// ========================================

export const markAsRead = async (
  notificationId,
  token
) => {

  const response =
    await axios.patch(
      `${API_URL}/${notificationId}/read`,
      {},
      authHeaders(token)
    );


  return response.data;
};


// ========================================
// MARK ALL AS READ
// ========================================

export const markAllAsRead = async (
  token
) => {

  const response =
    await axios.patch(
      `${API_URL}/read-all`,
      {},
      authHeaders(token)
    );


  return response.data;
};
