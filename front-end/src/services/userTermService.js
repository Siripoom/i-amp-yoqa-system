import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getUserTerms = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/user-terms`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user terms:", error);
    throw error;
  }
};

export const createUserTerms = async (userTermsData) => {
  const fullName = userTermsData;
  try {
    const response = await axios.post(`${API_URL}/api/user-terms`, fullName);
    return response.data;
  } catch (error) {
    console.error("Error creating user terms:", error);
    throw error;
  }
};

export const updateUserTerms = async (userId, userTermsData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/user-terms/${userId}`,
      userTermsData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user terms:", error);
    throw error;
  }
};
export const deleteUserTerms = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/user-terms/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting user terms:", error);
    throw error;
  }
};
export const getAllUserTerms = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/user-terms`);
    return response.data;
  } catch (error) {
    console.error("Error fetching all user terms:", error);
    throw error;
  }
};
