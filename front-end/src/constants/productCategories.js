export const PRODUCT_CATEGORIES = [
  { value: "private_yoga", label: "Private Yoga คลาสไพรเวท" },
  { value: "extend_your_days", label: "Extend Your Days โปรเติมวัน" },
];

export const getProductCategoryLabel = (value) =>
  PRODUCT_CATEGORIES.find((category) => category.value === value)?.label || "ยังไม่ระบุหมวดหมู่";
