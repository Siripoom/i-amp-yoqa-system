// utils/lineLogout.js
import liff from "@line/liff";

/**
 * Utility function to handle LINE logout
 * @returns {Promise<boolean>} - Returns true if logout was successful
 */
export const performLineLogout = async () => {
  try {
    // Check if LIFF is available
    if (typeof liff === "undefined") {
      console.warn("LIFF is not available");
      return false;
    }

    // Initialize LIFF if not already initialized
    if (!liff.isInClient()) {
      try {
        await liff.init({ liffId: import.meta.env.VITE_LINE_LIFF });
      } catch (initError) {
        console.error("Failed to initialize LIFF:", initError);
        return false;
      }
    }

    // Logout from LINE if logged in
    if (liff.isLoggedIn()) {
      liff.logout();
      console.log("LINE logout successful");
      return true;
    }

    return true; // Not logged in via LINE, consider it successful
  } catch (error) {
    console.error("Error during LINE logout:", error);
    return false;
  }
};

/**
 * Check if user is logged in via LINE
 * @returns {boolean}
 */
export const isLineLogin = () => {
  return (
    localStorage.getItem("LIFF_STORE:2007091295-9VRjXwVY:IDToken") !== null
  );
};

/**
 * Clear all LINE related tokens from localStorage
 */
export const clearLineTokens = () => {
  const lineKeys = [
    "LIFF_STORE:2007091295-9VRjXwVY:IDToken",
    "LIFF_STORE:2007091295-9VRjXwVY:accessToken",
    "LIFF_STORE:2007091295-9VRjXwVY:clientId",
    "LIFF_STORE:2007091295-9VRjXwVY:context",
    "LIFF_STORE:2007091295-9VRjXwVY:decodedIDToken",
    "LIFF_STORE:2007091295-9VRjXwVY:loginTmp",
  ];

  lineKeys.forEach((key) => {
    localStorage.removeItem(key);
  });
};

/**
 * Complete logout function that handles both regular and LINE logout
 * @param {Function} navigate - React Router navigate function
 * @param {Function} showMessage - Antd message function
 */
export const performCompleteLogout = async (navigate, showMessage) => {
  try {
    // Perform LINE logout if user logged in via LINE
    if (isLineLogin()) {
      await performLineLogout();
    }

    // Clear all tokens
    const allKeys = [
      "token",
      "username",
      "user_id",
      "role",
      ...Object.keys(localStorage).filter((key) =>
        key.startsWith("LIFF_STORE:")
      ),
    ];

    allKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Show message and redirect
    if (showMessage) {
      showMessage.warning("Your session has expired. Please log in again.");
    }

    if (navigate) {
      navigate("/auth/signin");
    }

    return true;
  } catch (error) {
    console.error("Error during complete logout:", error);
    // Force clear localStorage and redirect even if error occurs
    localStorage.clear();
    if (navigate) {
      navigate("/auth/signin");
    }
    return false;
  }
};
