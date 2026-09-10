const PACKAGE_ACTIVATION_DAYS = 30;

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getActivationExpiry = (approvedAt) =>
  addDays(approvedAt, PACKAGE_ACTIVATION_DAYS);

const activatePackageOnFirstUse = (user, usedAt) => {
  if (user.first_used_date) return false;
  user.first_used_date = usedAt;
  if (user.product_duration && user.product_duration > 0) {
    user.sessions_expiry_date = addDays(usedAt, user.product_duration);
  }
  return true;
};

module.exports = {
  PACKAGE_ACTIVATION_DAYS,
  addDays,
  getActivationExpiry,
  activatePackageOnFirstUse,
};
