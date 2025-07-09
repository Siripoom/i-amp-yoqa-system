// src/services/userService.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL; // Replace with your actual back-end URL

export const getUsers = async () => {
  try {
    const response = await axios.get(API_URL + "/api/users");

    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/api/users`, userData);
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await axios.put(`${API_URL}/api/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/users/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

//getuserbyid
export const getUserById = async (id) => {
  try {
    console.log("Fetching user by ID:", id); // Log the ID for debugging
    const response = await axios.get(`${API_URL}/api/users/${id}`);
    console.log("User data:", response.data); // Log the user data for debugging
    return response.data;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
};
