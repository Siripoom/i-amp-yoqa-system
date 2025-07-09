import axios from "axios";

// Replace with your API URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper function to handle API responses and errors
const handleResponse = (response) => {
  // Accept both 200 and 201 as success responses
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

// Helper function to create FormData with support for nested objects (promotion)
const createFormData = (productData) => {
  const formData = new FormData();

  Object.keys(productData).forEach((key) => {
    if (key === "image" && productData[key]) {
      // Handle image files
      if (productData[key][0]?.originFileObj) {
        formData.append(key, productData[key][0].originFileObj);
      } else if (typeof productData[key] === "string") {
        // If it's already a URL string, append as is
        formData.append(key, productData[key]);
      }
    } else if (key === "promotion") {
      // Handle promotion object - ส่งเสมอแม้จะเป็น null
      if (productData[key] === null) {
        formData.append(key, "null"); // ส่งเป็น string 'null'
      } else if (productData[key]) {
        formData.append(key, JSON.stringify(productData[key]));
      } else {
        formData.append(key, "null"); // กรณีไม่มีข้อมูลก็ส่ง 'null'
      }
    } else if (key === "hotSale") {
      // Ensure boolean is properly handled
      formData.append(
        key,
        productData[key] === true || productData[key] === "true"
      );
    } else if (productData[key] !== undefined && productData[key] !== null) {
      formData.append(key, productData[key]);
    }
  });

  console.log("FormData contents:"); // Debug log
  for (let pair of formData.entries()) {
    console.log(pair[0] + ": ", pair[1]);
  }

  return formData;
};

// Get all products with optional filtering and sorting
export const getProducts = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add supported query parameters
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
    if (params.hotSale !== undefined)
      queryParams.append("hotSale", params.hotSale);
    if (params.onPromotion !== undefined)
      queryParams.append("onPromotion", params.onPromotion);
    if (params.minPrice) queryParams.append("minPrice", params.minPrice);
    if (params.maxPrice) queryParams.append("maxPrice", params.maxPrice);

    const queryString = queryParams.toString();
    const url = queryString
      ? `${API_BASE_URL}/api/products?${queryString}`
      : `${API_BASE_URL}/api/products`;

    const response = await axios.get(url);
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};

// Get hot sale products
export const getHotSaleProducts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/products/hot-sale`);
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};

// Get products on promotion
export const getPromotionProducts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/products/promotion`);
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};

// Get single product by ID
export const getProductById = async (productId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/products/${productId}`
    );
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};

// Create new product
export const createProduct = async (productData) => {
  try {
    const formData = createFormData(productData);
    const response = await axios.post(
      `${API_BASE_URL}/api/products`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};

// Update existing product
export const updateProduct = async (productId, productData) => {
  try {
    const formData = createFormData(productData);
    const response = await axios.put(
      `${API_BASE_URL}/api/products/${productId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};

// Delete product
export const deleteProduct = async (productId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/api/products/${productId}`
    );
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};

// Toggle hot sale status
export const toggleHotSale = async (productId) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/api/products/${productId}/toggle-hot-sale`
    );
    return handleResponse(response);
  } catch (error) {
    handleError(error);
  }
};

// Helper functions for frontend use

// Check if promotion is currently active
export const isPromotionActive = (promotion) => {
  if (!promotion || !promotion.startDate || !promotion.endDate) {
    return false;
  }

  const now = new Date();
  const startDate = new Date(promotion.startDate);
  const endDate = new Date(promotion.endDate);

  return now >= startDate && now <= endDate;
};

// Get effective price (considering active promotion)
export const getEffectivePrice = (product) => {
  if (product.isPromotionActive && product.promotion?.price) {
    return product.promotion.price;
  }
  return product.price;
};

// Calculate discount percentage
export const getDiscountPercentage = (originalPrice, promotionPrice) => {
  if (!promotionPrice || promotionPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - promotionPrice) / originalPrice) * 100);
};

// Format price for display
export const formatPrice = (price, currency = "฿") => {
  return `${currency}${price.toLocaleString()}`;
};

// Get products with additional computed fields
export const getProductsWithComputedFields = async (params = {}) => {
  try {
    const result = await getProducts(params);

    // Add computed fields if not already present
    if (result.data) {
      result.data = result.data.map((product) => ({
        ...product,
        isPromotionActive:
          product.isPromotionActive ?? isPromotionActive(product.promotion),
        effectivePrice: product.effectivePrice ?? getEffectivePrice(product),
        discountPercentage: product.promotion?.price
          ? getDiscountPercentage(product.price, product.promotion.price)
          : 0,
        formattedPrice: formatPrice(product.price),
        formattedEffectivePrice: formatPrice(
          product.effectivePrice ?? getEffectivePrice(product)
        ),
      }));
    }

    return result;
  } catch (error) {
    handleError(error);
  }
};

// Batch operations
export const updateMultipleProducts = async (updates) => {
  try {
    const promises = updates.map(({ id, data }) => updateProduct(id, data));
    const results = await Promise.allSettled(promises);

    const successful = results.filter(
      (result) => result.status === "fulfilled"
    );
    const failed = results.filter((result) => result.status === "rejected");

    return {
      successful: successful.length,
      failed: failed.length,
      results: results,
    };
  } catch (error) {
    handleError(error);
  }
};

export const deleteMultipleProducts = async (productIds) => {
  try {
    const promises = productIds.map((id) => deleteProduct(id));
    const results = await Promise.allSettled(promises);

    const successful = results.filter(
      (result) => result.status === "fulfilled"
    );
    const failed = results.filter((result) => result.status === "rejected");

    return {
      successful: successful.length,
      failed: failed.length,
      results: results,
    };
  } catch (error) {
    handleError(error);
  }
};
