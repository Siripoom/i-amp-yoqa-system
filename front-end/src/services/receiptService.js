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

  // ดึงใบเสร็จทั้งหมด
  getAllReceipts: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/receipts`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // ดาวน์โหลดใบเสร็จเป็น DOCX
  downloadReceiptDOCX: async (receiptId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/receipts/${receiptId}/docx`,
        {
          headers: {
            ...getAuthHeaders(),
            "Accept":
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          },
          responseType: "blob",
        }
      );

      // Check if response is JSON (error)
      const contentType = response.headers["content-type"];
      if (contentType && contentType.includes("application/json")) {
        const text = await new Response(response.data).text();
        const error = JSON.parse(text);
        throw new Error(error.message || "Failed to download DOCX");
      }

      // Validate DOCX content type
      if (
        !contentType.includes(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
      ) {
        throw new Error("Invalid file type received");
      }

      return response.data;
    } catch (error) {
      console.error("DOCX Download Error:", error);
      if (error.response?.status === 500) {
        throw new Error("Template file missing or server configuration error");
      }
      throw error;
    }
  },

  // ดาวน์โหลดใบเสร็จเป็น PDF (จาก DOCX template)
  downloadReceiptPDF: async (receiptId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/receipts/${receiptId}/pdf`,
        {
          headers: {
            ...getAuthHeaders(),
            "Accept": "application/pdf",
          },
          responseType: "blob",
        }
      );

      // Check if response is JSON (error)
      const contentType = response.headers["content-type"];
      if (contentType && contentType.includes("application/json")) {
        const text = await new Response(response.data).text();
        const error = JSON.parse(text);
        throw new Error(error.message || "Failed to download PDF");
      }

      // Validate PDF content type
      if (!contentType.includes("application/pdf")) {
        throw new Error("Invalid file type received");
      }

      return response.data;
    } catch (error) {
      console.error("PDF Download Error:", error);
      if (error.response?.status === 500) {
        throw new Error("Template file missing or server configuration error");
      }
      throw error;
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

  // ดึงใบเสร็จตาม user ID (สำหรับ user ดูใบเสร็จของตัวเอง)
  getReceiptsByUserId: async (userId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/receipts/user/${userId}`,
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // ดึงใบเสร็จตาม order ID
  getReceiptByOrderId: async (orderId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/receipts/order/${orderId}`,
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
