import axios from "axios";

const apiUrl = "http://localhost:5000/api/courses";

export const getCourses = async () => {
  const response = await axios.get(apiUrl);
  return response.data;
};

export const createCourse = async (courseData) => {
  const response = await axios.post(apiUrl, courseData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateCourse = async (id, courseData) => {
  const response = await axios.put(`${apiUrl}/${id}`, courseData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteCourse = async (id) => {
  const response = await axios.delete(`${apiUrl}/${id}`);
  return response.data;
};
