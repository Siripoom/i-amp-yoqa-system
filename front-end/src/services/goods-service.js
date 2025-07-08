import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to handle API responses and errors
const handleResponse = (response) => {
  if (response.status === 200 || response.status === 201) {
    return response.data;
  } else {
    throw new Error(`Unexpected response status: ${response.status}`);
  }
};

const handleError = (error) => {
  console.error("API Error:", error);
  throw new Error(error.response?.data?.message || "An error occurred");
};

const goodsService = {
  // ✅ ดึงสินค้าทั้งหมด (มี pagination และ filtering)
  getAllGoods: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/api/goods`, { params });
      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ ดึงสินค้าตาม ID
  getGoodsById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/api/goods/${id}`);
      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ ค้นหาสินค้า
  searchGoods: async (query, params = {}) => {
    try {
      const searchParams = { query, ...params };
      const response = await axios.get(`${API_URL}/api/goods/search/query`, {
        params: searchParams,
      });
      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ ดึงสินค้าที่กำลังลดราคา (Promotional Goods)
  getPromotionalGoods: async (params = {}) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/goods/promotions/active`,
        {
          params,
        }
      );
      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ ดึงสินค้าขายดี (Hot Sale Goods)
  getHotSaleGoods: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/api/goods/hot-sale/all`, {
        params,
      });
      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ สร้างสินค้าใหม่ (สำหรับ admin)
  createGoods: async (goodsData) => {
    try {
      const formData = new FormData();

      // เพิ่มข้อมูลทั่วไป
      Object.keys(goodsData).forEach((key) => {
        if (key === "image" && goodsData[key]) {
          // Handle file upload
          if (goodsData[key].length > 0) {
            formData.append(key, goodsData[key][0].originFileObj);
          }
        } else if (key === "promotion" && goodsData[key]) {
          // Handle promotion data as JSON string
          formData.append(key, JSON.stringify(goodsData[key]));
        } else {
          formData.append(key, goodsData[key]);
        }
      });

      const response = await axios.post(`${API_URL}/api/goods`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ อัปเดตสินค้า (สำหรับ admin)
  updateGoods: async (id, goodsData) => {
    try {
      const formData = new FormData();

      Object.keys(goodsData).forEach((key) => {
        if (key === "image" && goodsData[key]) {
          if (goodsData[key].length > 0) {
            formData.append(key, goodsData[key][0].originFileObj);
          }
        } else if (key === "promotion" && goodsData[key]) {
          formData.append(key, JSON.stringify(goodsData[key]));
        } else {
          formData.append(key, goodsData[key]);
        }
      });

      const response = await axios.put(`${API_URL}/api/goods/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ ลบสินค้า (สำหรับ admin)
  deleteGoods: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/api/goods/${id}`);
      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ อัปเดตสต็อกสินค้า
  updateStock: async (id, stock) => {
    try {
      const response = await axios.patch(`${API_URL}/api/goods/${id}/stock`, {
        stock,
      });
      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ ฟังก์ชันสำหรับหน้าบ้าน - ดึงสินค้าใหม่ล่าสุด
  getLatestGoods: async (limit = 10) => {
    try {
      const params = {
        limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      };
      const response = await axios.get(`${API_URL}/api/goods`, { params });
      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ ฟังก์ชันสำหรับหน้าบ้าน - ดึงสินค้าที่มีสต็อก
  getAvailableGoods: async (params = {}) => {
    try {
      const searchParams = {
        inStock: "true",
        ...params,
      };
      const response = await axios.get(`${API_URL}/api/goods`, {
        params: searchParams,
      });
      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ ฟังก์ชันสำหรับหน้าบ้าน - ฟิลเตอร์สินค้าตามราคา
  getGoodsByPriceRange: async (minPrice, maxPrice, params = {}) => {
    try {
      const searchParams = {
        minPrice,
        maxPrice,
        ...params,
      };
      const response = await axios.get(`${API_URL}/api/goods`, {
        params: searchParams,
      });
      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ ฟังก์ชันสำหรับหน้าบ้าน - ดึงสินค้าแนะนำ (Hot Sale + Promotional)
  getRecommendedGoods: async (limit = 8) => {
    try {
      const [hotSaleResponse, promotionalResponse] = await Promise.all([
        axios.get(`${API_URL}/api/goods/hot-sale/all`, {
          params: { limit: Math.ceil(limit / 2) },
        }),
        axios.get(`${API_URL}/api/goods/promotions/active`, {
          params: { limit: Math.ceil(limit / 2) },
        }),
      ]);

      const hotSaleData = handleResponse(hotSaleResponse);
      const promotionalData = handleResponse(promotionalResponse);

      // รวมข้อมูลและตัดให้เหลือตามจำนวนที่ต้องการ
      const combined = [
        ...(hotSaleData.data || []),
        ...(promotionalData.data || []),
      ].slice(0, limit);

      return {
        status: "success",
        data: combined,
        total: combined.length,
      };
    } catch (error) {
      handleError(error);
    }
  },
};

export default goodsService;
