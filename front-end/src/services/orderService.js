import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const orderService = {
  // ✅ สร้างคำสั่งซื้อใหม่ (รองรับทั้ง product และ goods)
  createOrder: async (formData) => {
    try {
      const response = await axios.post(`${API_URL}/api/orders`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // ✅ สร้างคำสั่งซื้อ product
  createProductOrder: async (orderData) => {
    try {
      const formData = new FormData();
      formData.append("user_id", orderData.user_id);
      formData.append("order_type", "product");
      formData.append("product_id", orderData.product_id);
      formData.append("quantity", orderData.quantity || 1);

      if (orderData.image) {
        formData.append("image", orderData.image);
      }

      const response = await axios.post(`${API_URL}/api/orders`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // ✅ สร้างคำสั่งซื้อ goods
  createGoodsOrder: async (orderData) => {
    try {
      const formData = new FormData();
      formData.append("user_id", orderData.user_id);
      formData.append("order_type", "goods");
      formData.append("goods_id", orderData.goods_id);
      formData.append("quantity", orderData.quantity || 1);

      if (orderData.size) {
        formData.append("size", orderData.size);
      }
      if (orderData.color) {
        formData.append("color", orderData.color);
      }
      if (orderData.image) {
        formData.append("image", orderData.image);
      }

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

  // ✅ ดึงรายการคำสั่งซื้อตาม order_type
  getOrdersByType: async (orderType) => {
    try {
      if (!["product", "goods"].includes(orderType)) {
        throw new Error("Invalid order type. Must be 'product' or 'goods'");
      }

      const response = await axios.get(
        `${API_URL}/api/orders/type/${orderType}`
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // ✅ ดึงรายการคำสั่งซื้อ product เท่านั้น
  getProductOrders: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/type/product`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // ✅ ดึงรายการคำสั่งซื้อ goods เท่านั้น
  getGoodsOrders: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/type/goods`);
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
      const token = localStorage.getItem("token");
      console.log('🌐 Debug getOrdersByUserId:');
      console.log('  - User ID:', userId);
      console.log('  - Token exists:', !!token);
      console.log('  - Token preview:', token ? token.substring(0, 20) + '...' : 'No token');

      const response = await axios.get(`${API_URL}/api/orders/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ API call successful:', response.status);
      return response.data;
    } catch (error) {
      console.log('❌ API call failed:');
      console.log('  - Error status:', error.response?.status);
      console.log('  - Error data:', error.response?.data);
      console.log('  - Error message:', error.message);
      throw error.response ? error.response.data : error.message;
    }
  },

  // ✅ ดึงรายการคำสั่งซื้อ product ของ User ตาม ID
  getProductOrdersByUserId: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/user/${userId}`);
      if (response.data && response.data.data) {
        // กรองเฉพาะ product orders
        const productOrders = response.data.data.filter(
          (order) => order.order_type === "product"
        );
        return {
          ...response.data,
          data: productOrders,
          count: productOrders.length,
        };
      }
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // ✅ ดึงรายการคำสั่งซื้อ goods ของ User ตาม ID
  getGoodsOrdersByUserId: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/user/${userId}`);
      if (response.data && response.data.data) {
        // กรองเฉพาะ goods orders
        const goodsOrders = response.data.data.filter(
          (order) => order.order_type === "goods"
        );
        return {
          ...response.data,
          data: goodsOrders,
          count: goodsOrders.length,
        };
      }
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // ✅ อัปเดตคำสั่งซื้อ
  updateOrder: async (orderId, formData) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // ✅ อัปเดตสถานะคำสั่งซื้อ
  updateOrderStatus: async (orderId, status, invoice) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        { status, invoice }
      );
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

  // ✅ ดึงสถิติการสั่งซื้อ
  getOrderStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/orders/stats`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message;
    }
  },

  // ✅ Helper functions สำหรับสร้าง FormData

  // สร้าง FormData สำหรับ product order
  createProductOrderFormData: (orderData) => {
    const formData = new FormData();
    formData.append("user_id", orderData.user_id);
    formData.append("order_type", "product");
    formData.append("product_id", orderData.product_id);
    formData.append("quantity", orderData.quantity || 1);

    if (orderData.image) {
      if (orderData.image.originFileObj) {
        // สำหรับ Ant Design Upload component
        formData.append("image", orderData.image.originFileObj);
      } else if (orderData.image instanceof File) {
        // สำหรับ File object โดยตรง
        formData.append("image", orderData.image);
      }
    }

    return formData;
  },

  // สร้าง FormData สำหรับ goods order
  createGoodsOrderFormData: (orderData) => {
    const formData = new FormData();
    formData.append("user_id", orderData.user_id);
    formData.append("order_type", "goods");
    formData.append("goods_id", orderData.goods_id);
    formData.append("quantity", orderData.quantity || 1);

    if (orderData.size) formData.append("size", orderData.size);
    if (orderData.color) formData.append("color", orderData.color);

    if (orderData.image) {
      if (orderData.image.originFileObj) {
        // สำหรับ Ant Design Upload component
        formData.append("image", orderData.image.originFileObj);
      } else if (orderData.image instanceof File) {
        // สำหรับ File object โดยตรง
        formData.append("image", orderData.image);
      }
    }

    return formData;
  },

  // ✅ ฟังก์ชันช่วยสำหรับการจัดการข้อมูล

  // แยกประเภท order จากข้อมูล
  separateOrdersByType: (orders) => {
    if (!Array.isArray(orders)) return { productOrders: [], goodsOrders: [] };

    const productOrders = orders.filter(
      (order) => order.order_type === "product"
    );
    const goodsOrders = orders.filter((order) => order.order_type === "goods");

    return { productOrders, goodsOrders };
  },

  // คำนวณสถิติเบื้องต้น
  calculateOrderSummary: (orders) => {
    if (!Array.isArray(orders)) return null;

    const summary = {
      total: orders.length,
      product: orders.filter((order) => order.order_type === "product").length,
      goods: orders.filter((order) => order.order_type === "goods").length,
      pending: orders.filter((order) => order.status === "รออนุมัติ").length,
      approved: orders.filter((order) => order.status === "อนุมัติ").length,
      cancelled: orders.filter((order) => order.status === "ยกเลิก").length,
      totalValue: orders.reduce(
        (sum, order) => sum + (order.total_price || 0),
        0
      ),
    };

    return summary;
  },

  // format ข้อมูล order สำหรับแสดงผล
  formatOrderForDisplay: (order) => {
    if (!order) return null;

    const isProduct = order.order_type === "product";
    const item = isProduct ? order.product_id : order.goods_id;

    return {
      ...order,
      itemName: isProduct
        ? `Session: ${item?.sessions || "N/A"}`
        : item?.goods || "N/A",
      itemPrice: item?.price || 0,
      itemDetails: isProduct
        ? `${item?.sessions || 0} sessions, ${item?.duration || 0} duration`
        : `${order.size || "N/A"} size, ${order.color || "N/A"} color`,
      displayPrice:
        order.total_price || item?.price * (order.quantity || 1) || 0,
    };
  },
};

export default orderService;
