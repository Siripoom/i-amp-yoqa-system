import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api"; // Replace with your API URL

export const getProducts = async () => {
  const response = await axios.get(`${API_BASE_URL}/products`);
  return response.data; // Return only the products array
};

export const createProduct = async (productData) => {
  const formData = new FormData();
  Object.keys(productData).forEach((key) => {
    formData.append(key, productData[key]);
  });
  const response = await axios.post(`${API_BASE_URL}/products`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateProduct = async (productId, productData) => {
  const formData = new FormData();
  Object.keys(productData).forEach((key) => {
    formData.append(key, productData[key]);
  });
  const response = await axios.put(
    `${API_BASE_URL}/products/${productId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await axios.delete(`${API_BASE_URL}/products/${productId}`);
  return response.data;
};
