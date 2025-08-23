import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to get auth headers
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const receiptService = {
  // สร้างใบเสร็จอัตโนมัติจากการสั่งซื้อ
  createReceipt: async (receiptData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/receipts/manual`,
        receiptData,
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // สร้างใบเสร็จแบบเดิม (จาก orderId)
  createReceiptFromOrder: async (receiptData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/receipts`,
        receiptData,
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // ค้นหาใบเสร็จด้วยเลขที่ใบเสร็จ
  getReceiptByNumber: async (receiptNumber) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/receipts/number/${receiptNumber}`,
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // ค้นหาใบเสร็จด้วยชื่อลูกค้า
  getReceiptsByCustomer: async (customerName) => {
    try {
      const response = await axios.get(`${API_URL}/api/receipts/customer`, {
        params: { name: customerName },
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // ค้นหาใบเสร็จด้วยช่วงวันที่
  getReceiptsByDateRange: async (startDate, endDate) => {
    try {
      const response = await axios.get(`${API_URL}/api/receipts/date`, {
        params: { start: startDate, end: endDate },
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // ดาวน์โหลดใบเสร็จเป็น PDF
  downloadReceiptPDF: async (receiptId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/receipts/${receiptId}/pdf`,
        {
          headers: getAuthHeaders(),
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // พิมพ์ใบเสร็จ
  printReceipt: async (receiptId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/receipts/${receiptId}/print`,
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default receiptService;
