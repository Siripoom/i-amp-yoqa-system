import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

//* HeroImage Service
export const HeroImage = {
  getHeroImage: async () => {
    const response = await axios.get(`${API_URL}/api/heroImages`);
    return response.data;
  },
  updateHeroImage: async (id, image) => {
    const response = await axios.put(`${API_URL}/api/heroImages/${id}`, image, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  deleteHeroImage: async (id) => {
    const response = await axios.delete(`${API_URL}/api/heroImages/${id}`);
    return response.data;
  },
  createHeroImage: async (image) => {
    const response = await axios.post(`${API_URL}/api/heroImages`, image, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export const MasterImage = {
  getMasterImage: async () => {
    const response = await axios.get(`${API_URL}/api/masters`);
    return response.data;
  },
  updateMasterImage: async (id, formData) => {
    const response = await axios.put(`${API_URL}/api/masters/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  deleteMasterImage: async (id) => {
    const response = await axios.delete(`${API_URL}/api/masters/${id}`);
    return response.data;
  },
  createMasterImage: async (formData) => {
    const response = await axios.post(`${API_URL}/api/masters`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  getMasterById: async (id) => {
    const response = await axios.get(`${API_URL}/api/masters/${id}`);
    return response.data;
  },
};

export const QrcodePayment = {
  getQrcodePayment: async () => {
    const response = await axios.get(`${API_URL}/api/qrCodes`);
    return response.data;
  },
  updateQrcodePayment: async (id, image) => {
    const response = await axios.patch(`${API_URL}/api/qrCodes/${id}`, image, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  deleteQrcodePayment: async (id) => {
    const response = await axios.delete(`${API_URL}/api/qrCodes/${id}`);
    return response.data;
  },
  createQrcodePayment: async (image) => {
    const response = await axios.post(`${API_URL}/api/qrCodes`, image, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

// image Catalog

export const ImageCatalog = {
  getImageCatalog: async () => {
    const response = await axios.get(`${API_URL}/api/class-catalog`);
    return response.data;
  },
  updateImageCatalog: async (id, data) => {
    
    const response = await axios.put(
      `${API_URL}/api/class-catalog/${id}`,
      data,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },
  deleteImageCatalog: async (id) => {
    const response = await axios.delete(`${API_URL}/api/class-catalog/${id}`);
    return response.data;
  },
  createImageCatalog: async (data) => {
    const response = await axios.post(`${API_URL}/api/class-catalog`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
