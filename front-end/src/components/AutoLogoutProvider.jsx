import { useEffect, useState } from "react";
import useAutoLogout from "../hooks/useAutoLogout";
import { isLineLogin } from "../utils/lineLogout";

/**
 * Provider component that wraps the application and manages auto-logout functionality
 * Only activates auto-logout for Members, not for Admins
 * Also handles LINE login users
 */
const AutoLogoutProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLineUser, setIsLineUser] = useState(false);

  // Check user role and login method on component mount and token changes
  useEffect(() => {
    const checkUserRole = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const lineLoginStatus = isLineLogin();

      if (token && role) {
        setUserRole(role);
        setIsLineUser(lineLoginStatus);
      } else {
        setUserRole(null);
        setIsLineUser(false);
      }

      setIsLoading(false);
    };

    // Initial check
    checkUserRole();

    // Listen for storage events (in case role or token changes in another tab)
    const handleStorageChange = (e) => {
      // Only react to changes in auth-related keys
      if (
        ["token", "role", "username", "user_id"].includes(e.key) ||
        e.key?.startsWith("LIFF_STORE:")
      ) {
        checkUserRole();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically in case of programmatic changes
    const intervalId = setInterval(checkUserRole, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  // Only activate auto-logout for Member role, not for Admin
  // Works for both regular login and LINE login
  const isAutoLogoutActive = userRole === "Member";

  // Determine timeout based on login method
  // LINE users might need shorter timeout due to token expiration
  const timeoutMinutes = isLineUser ? 8 : 10; // 8 minutes for LINE, 10 for regular

  // Initialize auto-logout with appropriate timeout
  const autoLogoutData = useAutoLogout(timeoutMinutes, isAutoLogoutActive);

  // Log auto-logout status for debugging (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("AutoLogout Status:", {
        userRole,
        isLineUser,
        isAutoLogoutActive,
        timeoutMinutes,
        remainingSeconds: autoLogoutData.remainingSeconds,
      });
    }
  }, [
    userRole,
    isLineUser,
    isAutoLogoutActive,
    timeoutMinutes,
    autoLogoutData.remainingSeconds,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return children;
};

export default AutoLogoutProvider;
