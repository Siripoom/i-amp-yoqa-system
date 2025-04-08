import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const orderService = {
  // ✅ สร้างคำสั่งซื้อใหม่
  createOrder: async (formData) => {
    console.log(formData);
    try {
      const response = await axios.post(`${API_URL}/api/orders`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // ✅ ดึงรายการคำสั่งซื้อทั้งหมด
  getAllOrders: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders`);

      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // ✅ ดึงรายละเอียดคำสั่งซื้อตาม ID
  getOrderById: async (orderId) => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // ✅ ดึงรายการคำสั่งซื้อทั้งหมดของ User ตาม ID
  getOrdersByUserId: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // ✅ ลบคำสั่งซื้อ
  deleteOrder: async (orderId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },
};
// ✅ อัปเดตสถานะคำสั่งซื้อ
export default orderService;
