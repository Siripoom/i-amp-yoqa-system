import axios from "axios";

// Replace with your API URL
const API_BASE_URL = import.meta.env.VITE_API_URL;
export const getProducts = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/products`);
  console.log(response.data);
  return response.data; // Return only the products array
};

export const createProduct = async (productData) => {
  const formData = new FormData();
  Object.keys(productData).forEach((key) => {
    formData.append(key, productData[key]);
  });
  const response = await axios.post(`${API_BASE_URL}/api/products`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateProduct = async (productId, productData) => {
  const response = await axios.put(
    `${API_BASE_URL}/api/products/${productId}`,
    productData
  );
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await axios.delete(
    `${API_BASE_URL}/api/products/${productId}`
  );
  return response.data;
};
