import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const getRecommendation = async (token) => {
  const response = await axios.get(`${API_URL}/api/recommendation/`, {
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};
