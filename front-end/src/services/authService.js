import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/api/auth/login`, {
    email,
    password,
  });

  return response.data;
};

export const register = async (userData) => {
  const response = await axios.post(`${API_URL}/api/users`, userData);
  return response.data;
};

export const lineLogin = async (data) => {
  const response = await axios.post(`${API_URL}/api/auth/line`, data);
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await axios.post(
    `${API_URL}/api/auth/request-password-reset`,
    {
      email,
    }
  );
  return response.data;
};

export const resetPassword = async (resetToken, newPassword) => {
  const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
    resetToken,
    newPassword,
  });
  return response.data;
};
