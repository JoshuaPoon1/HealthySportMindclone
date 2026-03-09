import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const getStreak = async (token) => {
  return axios.get(`${API_URL}/api/streak/`, {
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const postCheckIn = async (token, mood, readiness, notes = "") => {
  return axios.post(
    `${API_URL}/api/checkin/`,
    { mood, readiness, notes },
    {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};
