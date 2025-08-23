import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to get auth headers
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const financeService = {
  // Income API calls
  getAllIncome: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/api/income?${queryString}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getTotalIncomeByPeriod: async (startDate, endDate) => {
    const response = await axios.get(`${API_URL}/api/income/total`, {
      params: { start_date: startDate, end_date: endDate },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getIncomeByType: async (startDate, endDate) => {
    const response = await axios.get(`${API_URL}/api/income/by-type`, {
      params: { start_date: startDate, end_date: endDate },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getIncomeByPeriod: async (period = "month") => {
    const response = await axios.get(`${API_URL}/api/income/by-period`, {
      params: { period },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  createManualIncome: async (incomeData) => {
    const response = await axios.post(
      `${API_URL}/api/income/manual`,
      incomeData,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  updateIncome: async (id, incomeData) => {
    const response = await axios.put(
      `${API_URL}/api/income/${id}`,
      incomeData,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  deleteIncome: async (id) => {
    const response = await axios.delete(`${API_URL}/api/income/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Expense API calls
  getAllExpenses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/api/expenses?${queryString}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getTotalExpenseByPeriod: async (startDate, endDate) => {
    const response = await axios.get(`${API_URL}/api/expenses/total`, {
      params: { start_date: startDate, end_date: endDate },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getExpensesByCategory: async (startDate, endDate) => {
    const response = await axios.get(`${API_URL}/api/expenses/by-category`, {
      params: { start_date: startDate, end_date: endDate },
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // ใน services/financeService.js
  createExpense: async (formData) => { // รับ formData ที่สร้างเสร็จแล้วมาเลย
    const response = await axios.post(`${API_URL}/api/expenses`, formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateExpense: async (id, formData) => { // รับ formData ที่สร้างเสร็จแล้วมาเลย
    const response = await axios.put(
      `${API_URL}/api/expenses/${id}`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  deleteExpense: async (id) => {
    const response = await axios.delete(`${API_URL}/api/expenses/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  approveExpense: async (id) => {
    const response = await axios.post(
      `${API_URL}/api/expenses/${id}/approve`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  rejectExpense: async (id) => {
    const response = await axios.post(
      `${API_URL}/api/expenses/${id}/reject`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  // Financial Reports API calls
  getProfitLossReport: async (startDate, endDate) => {
    const response = await axios.get(
      `${API_URL}/api/financial-reports/profit-loss`,
      {
        params: { start_date: startDate, end_date: endDate },
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  getCashFlowReport: async (startDate, endDate) => {
    const response = await axios.get(
      `${API_URL}/api/financial-reports/cash-flow`,
      {
        params: { start_date: startDate, end_date: endDate },
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  getMonthlySummary: async (year, month) => {
    const response = await axios.get(
      `${API_URL}/api/financial-reports/monthly-summary`,
      {
        params: { year, month },
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  getFinancialComparison: async (
    fromDate,
    toDate,
    compareFromDate,
    compareToDate
  ) => {
    const response = await axios.get(
      `${API_URL}/api/financial-reports/comparison`,
      {
        params: {
          from_date: fromDate,
          to_date: toDate,
          compare_from_date: compareFromDate,
          compare_to_date: compareToDate,
        },
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  exportFinancialReportToExcel: async (reportType, startDate, endDate) => {
    const response = await axios.get(
      `${API_URL}/api/financial-reports/export/excel`,
      {
        params: {
          report_type: reportType,
          start_date: startDate,
          end_date: endDate,
        },
        headers: getAuthHeaders(),
        responseType: "blob",
      }
    );
    return response.data;
  },
};

export default financeService;
