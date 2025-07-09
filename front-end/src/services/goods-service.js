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

// Helper function to create FormData for multiple images
const createGoodsFormData = (goodsData) => {
  const formData = new FormData();

  // Add basic fields
  const basicFields = [
    "goods",
    "code",
    "detail",
    "stock",
    "unit",
    "size",
    "color",
    "price",
    "hotSale",
  ];

  basicFields.forEach((field) => {
    if (goodsData[field] !== undefined && goodsData[field] !== null) {
      formData.append(field, goodsData[field]);
    }
  });

  // Handle multiple images
  if (goodsData.images && Array.isArray(goodsData.images)) {
    goodsData.images.forEach((image) => {
      if (image.originFileObj) {
        formData.append("images", image.originFileObj);
      }
    });
  } else if (goodsData.image && Array.isArray(goodsData.image)) {
    // Backward compatibility with old 'image' field
    goodsData.image.forEach((image) => {
      if (image.originFileObj) {
        formData.append("images", image.originFileObj);
      }
    });
  }

  // Handle promotion data
  if (goodsData.promotion) {
    formData.append("promotion", JSON.stringify(goodsData.promotion));
  }

  return formData;
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

  // ✅ สร้างสินค้าใหม่ (รองรับหลายภาพ)
  createGoods: async (goodsData) => {
    try {
      // Use the new helper function for FormData creation
      const formData = createGoodsFormData(goodsData);

      const response = await axios.post(`${API_URL}/api/goods`, goodsData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ อัปเดตสินค้า (รองรับหลายภาพ)
  updateGoods: async (id, goodsData) => {
    try {
      // Use the new helper function for FormData creation
      const formData = createGoodsFormData(goodsData);

      const response = await axios.put(
        `${API_URL}/api/goods/${id}`,
        goodsData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
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

  // ✅ ฟังก์ชันเพิ่มเติม - ดึงภาพทั้งหมดของสินค้า
  getGoodsImages: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/api/goods/${id}`);
      const data = handleResponse(response);
      return {
        status: "success",
        images: data.data.image || [],
      };
    } catch (error) {
      handleError(error);
    }
  },

  // ✅ ฟังก์ชันเพิ่มเติม - ตรวจสอบข้อมูลก่อนส่ง
  validateGoodsData: (goodsData) => {
    const errors = [];

    // Required fields validation
    if (!goodsData.goods || goodsData.goods.trim() === "") {
      errors.push("Goods name is required");
    }

    if (!goodsData.code || goodsData.code.trim() === "") {
      errors.push("Goods code is required");
    }

    if (!goodsData.price || goodsData.price <= 0) {
      errors.push("Price must be greater than 0");
    }

    if (!goodsData.unit || goodsData.unit.trim() === "") {
      errors.push("Unit is required");
    }

    if (goodsData.stock < 0) {
      errors.push("Stock cannot be negative");
    }

    // Image validation
    if (goodsData.images && Array.isArray(goodsData.images)) {
      if (goodsData.images.length > 3) {
        errors.push("Maximum 3 images allowed");
      }

      // Check each image file size and type
      goodsData.images.forEach((image, index) => {
        if (image.originFileObj) {
          const file = image.originFileObj;
          const maxSize = 2 * 1024 * 1024; // 2MB
          const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

          if (file.size > maxSize) {
            errors.push(`Image ${index + 1} must be smaller than 2MB`);
          }

          if (!allowedTypes.includes(file.type)) {
            errors.push(`Image ${index + 1} must be JPG or PNG format`);
          }
        }
      });
    }

    // Promotion validation
    if (goodsData.promotion) {
      if (
        goodsData.promotion.price &&
        goodsData.promotion.price >= goodsData.price
      ) {
        errors.push("Promotion price must be lower than regular price");
      }

      if (goodsData.promotion.startDate && goodsData.promotion.endDate) {
        const startDate = new Date(goodsData.promotion.startDate);
        const endDate = new Date(goodsData.promotion.endDate);

        if (startDate >= endDate) {
          errors.push("Promotion start date must be before end date");
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

export default goodsService;
