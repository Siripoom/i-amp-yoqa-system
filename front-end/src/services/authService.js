import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/api/auth/login`, {
    email,
    password,
  });
  console.log(response);
  return response.data;
};

export const register = async (userData) => {
  console.log(userData);
  const response = await axios.post(`${API_URL}api/users`, userData);
  return response.data;
};

export const lineLogin = async () => {
  const response = await axios.get(`${API_URL}/api/auth/line`);
  console.log(response);
  return response.data;
};
