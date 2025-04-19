import { useEffect, useState } from "react";
import useAutoLogout from "../hooks/useAutoLogout";

/**
 * Provider component that wraps the application and manages auto-logout functionality
 * Only activates auto-logout for Members, not for Admins
 */
const AutoLogoutProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check user role on component mount and token changes
  useEffect(() => {
    const checkUserRole = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (token && role) {
        setUserRole(role);
      } else {
        setUserRole(null);
      }

      setIsLoading(false);
    };

    // Initial check
    checkUserRole();

    // Listen for storage events (in case role or token changes in another tab)
    const handleStorageChange = () => {
      checkUserRole();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Only activate auto-logout for Member role, not for Admin
  const isAutoLogoutActive = userRole === "Member";

  // Initialize auto-logout with 10 minutes timeout, only for Member role
  useAutoLogout(10, isAutoLogoutActive);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return children;
};

export default AutoLogoutProvider;
