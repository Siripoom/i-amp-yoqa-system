export function apiErrorMessage(error, fallback = "Operation failed. Please try again.") {
  const message = error?.response?.data?.message || error?.message || (typeof error === "string" ? error : null);
  return typeof message === "string" && message.trim() ? message : fallback;
}
