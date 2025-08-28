const formatNumber = (number) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number);
};

module.exports = {
  formatNumber
};