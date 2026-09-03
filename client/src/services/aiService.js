import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API_URL = `${API_BASE_URL}/api/ai/predict-category`;

export const predictCategory = async (
  title,
  description,
  token
) => {

  const response = await axios.post(
    API_URL,
    {
      title,
      description,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};