import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const classService = {
  // 📌 สร้างคลาสใหม่
  createClass: async (classData) => {
    try {
      const response = await axios.post(`${API_URL}/api/classes`, classData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 📌 ดึงข้อมูลคลาสทั้งหมด
  getAllClasses: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/classes`, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 📌 ดึงข้อมูลคลาสตาม ID
  getClassById: async (classId) => {
    try {
      const response = await axios.get(`${API_URL}/api/classes/${classId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 📌 อัปเดตข้อมูลคลาส
  updateClass: async (classId, updatedData) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/classes/${classId}`,
        updatedData
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 📌 ลบคลาส
  deleteClass: async (classId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/classes/${classId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Add this function to the classService object
  duplicateClass: async (classId, newScheduleData = {}) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/classes/${classId}/duplicate`,
        newScheduleData
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default classService;
