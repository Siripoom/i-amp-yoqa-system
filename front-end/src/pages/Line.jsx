import { useCallback, useEffect, useState } from "react";
import liff from "@line/liff";
import { lineLogin } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

const Line = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLiffLogin = useCallback(async () => {
    try {
      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error("LINE ID token is unavailable");
      }

      const response = await lineLogin(idToken);

      // Store Token and User Data
      localStorage.setItem("token", response.token);
      localStorage.setItem("user_id", response.data._id);
      localStorage.setItem("username", `${response.data.first_name}`);
      localStorage.setItem("role", response.data.role_id);

      // Store LINE login indicator for auto-logout purposes
      localStorage.setItem("loginMethod", "line");

      message.success("LINE login successful!");

      // Check if user has accepted terms
      if (!response.data.userTerms) {
        // Redirect to terms page for first-time LINE users
        navigate("/term");
      } else {
        // Redirect based on role for users who have already accepted terms
        if (response.data.role_id === "Admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/");
        }
      }

      setLoading(false);
    } catch {
      console.error("LINE login request failed");
      setError("Login failed. Please try again.");
      setLoading(false);

      // Redirect to regular login on error
      setTimeout(() => {
        navigate("/auth/signin");
      }, 3000);
    }
  }, [navigate]);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: import.meta.env.VITE_LINE_LIFF });

        if (liff.isLoggedIn()) {
          await handleLiffLogin();
        } else {
          setError("Not logged in via LINE");
          setLoading(false);
        }
      } catch (error) {
        console.error("LIFF initialization failed:", error);
        setError("LIFF initialization failed");
        setLoading(false);
      }
    };

    initLiff();
  }, [handleLiffLogin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-text">
            Processing LINE login...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="text-center">
          <div className="text-error text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-error mb-2">Login Error</h1>
          <p className="text-text mb-6">{error}</p>
          <button
            onClick={() => navigate("/auth/signin")}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
          >
            Go to Login Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-surface">
      <div className="text-center">
        <div className="text-success text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-success">Login Successful</h1>
        <p className="text-text">Redirecting...</p>
      </div>
    </div>
  );
};

export default Line;
