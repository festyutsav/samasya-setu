import axios from "axios";

const API_URL =
  "http://127.0.0.1:5001/api/ai/predict-category";

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