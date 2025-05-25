import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import liff from "@line/liff";

/**
 * Custom hook for automatic logout after a period of inactivity
 * @param {number} timeoutMinutes - Timeout in minutes
 * @param {boolean} isActive - Whether the auto logout is active (e.g., for member role only)
 * @returns {Object} - Logout status information
 */
const useAutoLogout = (timeoutMinutes = 10, isActive = true) => {
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [remaining, setRemaining] = useState(timeoutMinutes * 60);
  const [isWarningVisible, setIsWarningVisible] = useState(false);

  // Update last activity timestamp on user interaction
  const updateActivity = () => {
    setLastActivity(Date.now());
    setIsWarningVisible(false);
  };

  // Check if user logged in via LINE
  const isLineLogin = () => {
    return (
      localStorage.getItem("LIFF_STORE:2007091295-9VRjXwVY:IDToken") !== null
    );
  };

  // Perform logout with LINE support
  const performLogout = async () => {
    try {
      // If user logged in via LINE, logout from LINE first
      if (isLineLogin()) {
        try {
          // Initialize LIFF if not already initialized
          if (!liff.isInClient() && !liff.isLoggedIn()) {
            await liff.init({ liffId: import.meta.env.VITE_LINE_LIFF });
          }

          // Logout from LINE if logged in
          if (liff.isLoggedIn()) {
            liff.logout();
          }
        } catch (liffError) {
          console.error("Error during LIFF logout:", liffError);
          // Continue with local logout even if LIFF logout fails
        }
      }

      // Clear all authentication data from localStorage
      const keysToRemove = [
        "token",
        "username",
        "user_id",
        "role",
        // LINE specific tokens
        "LIFF_STORE:2007091295-9VRjXwVY:IDToken",
        "LIFF_STORE:2007091295-9VRjXwVY:accessToken",
        "LIFF_STORE:2007091295-9VRjXwVY:clientId",
        "LIFF_STORE:2007091295-9VRjXwVY:context",
        "LIFF_STORE:2007091295-9VRjXwVY:decodedIDToken",
        "LIFF_STORE:2007091295-9VRjXwVY:loginTmp",
      ];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Show message and redirect to login page
      message.warning("Your session has expired. Please log in again.");
      navigate("/auth/signin");
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if there's an error, still clear localStorage and redirect
      localStorage.clear();
      navigate("/auth/signin");
    }
  };

  useEffect(() => {
    // Only activate auto-logout if the feature is enabled
    if (!isActive) return;

    // Set up event listeners for user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "touchend",
    ];

    events.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Set up interval to check for inactivity
    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = (now - lastActivity) / 1000; // in seconds
      const timeoutSeconds = timeoutMinutes * 60;
      const remainingTime = Math.max(0, timeoutSeconds - idleTime);

      setRemaining(Math.floor(remainingTime));

      // Show warning when less than 1 minute remains
      if (remainingTime < 60 && remainingTime > 0 && !isWarningVisible) {
        message.warning(
          "Your session will expire in less than a minute due to inactivity.",
          10
        );
        setIsWarningVisible(true);
      }

      // Logout if inactive for the timeout period
      if (idleTime >= timeoutSeconds) {
        performLogout();
        clearInterval(interval);
      }
    }, 1000); // Check every second

    // Cleanup event listeners and interval on component unmount
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [isActive, lastActivity, timeoutMinutes, navigate, isWarningVisible]);

  return {
    lastActivity,
    remainingSeconds: remaining,
    updateActivity,
    isWarningVisible,
    isLineLogin: isLineLogin(),
  };
};

export default useAutoLogout;
