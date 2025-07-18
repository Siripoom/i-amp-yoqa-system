import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const reservationService = {
  // 📌 จองคลาส
  createReservation: async (reservationData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/reserve`,
        reservationData
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 📌 ดึงรายการคลาสที่ผู้ใช้จองไว้
  getUserReservations: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/api/user/${userId}`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // 📌 ยกเลิกการจองคลาส
  cancelReservation: async (reservationId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.delete(
        `${API_URL}/api/cancel/${reservationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  getAllReservations: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/reserve`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
  // 📌 ยกเลิกการจองคลาส (สำหรับผู้ดูแลระบบ)
  adminCancelReservation: async (reservationId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/api/admin/cancel/${reservationId}`
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default reservationService;
