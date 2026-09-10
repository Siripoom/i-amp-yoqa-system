const { companyInfo } = require("../config/brand");

const currentCompanyInfo = () => ({ ...companyInfo });

const presentReceipt = (receipt) => {
  const value = typeof receipt?.toObject === "function" ? receipt.toObject() : receipt;
  return value ? { ...value, companyInfo: currentCompanyInfo() } : value;
};

const presentReceipts = (receipts) => receipts.map(presentReceipt);

module.exports = { currentCompanyInfo, presentReceipt, presentReceipts };
