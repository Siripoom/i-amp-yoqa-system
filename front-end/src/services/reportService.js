import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const MasterReport = {
  getMasterReport: async () => {
    const response = await axios.get(`${API_URL}/api/instructorReports`);
    return response.data;
  },
  getMasterReportByName: async (name) => {
    const response = await axios.get(
      `${API_URL}/api/instructorReports/${name}`
    );
    return response.data;
  },
  deleteMasterReport: async (name) => {
    const response = await axios.delete(
      `${API_URL}/api/instructorReports/${name}`
    );
    return response.data;
  },
};
