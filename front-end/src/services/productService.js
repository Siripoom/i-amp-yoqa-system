import axios from "axios";

// Replace with your API URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper function to handle API responses and errors
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

// Helper function to create FormData
const createFormData = (productData) => {
  const formData = new FormData();
  Object.keys(productData).forEach((key) => {
    if (key === "image" && productData[key]) {
      formData.append(key, productData[key][0].originFileObj); // For image files
    } else {
      formData.append(key, productData[key]);
    }
  });
  return formData;
};

// Get all products
export const getProducts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/products`);
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
