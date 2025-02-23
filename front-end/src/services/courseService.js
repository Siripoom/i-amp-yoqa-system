import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getCourses = async () => {
  const response = await axios.get(`${API_URL}/api/courses`);
  return response.data;
};

export const createCourse = async (courseData) => {
  const response = await axios.post(`${API_URL}/api/courses`, courseData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateCourse = async (id, courseData) => {
  const response = await axios.put(`${API_URL}/api/courses/${id}`, courseData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteCourse = async (id) => {
  const response = await axios.delete(`${API_URL}/api/courses/${id}`);
  return response.data;
};
