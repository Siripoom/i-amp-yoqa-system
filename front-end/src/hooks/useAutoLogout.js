import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

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

  // Perform logout
  const performLogout = () => {
    // Clear all authentication data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");

    // Show message and redirect to login page
    message.warning("Your session has expired. Please log in again.");
    navigate("/auth/signin");
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
    ];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity);
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
  };
};

export default useAutoLogout;
