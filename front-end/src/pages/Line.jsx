import { useEffect, useState } from "react";
import liff from "@line/liff";
import { lineLogin } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

const Line = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        // Initialize LIFF
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
  }, []);

  const handleLiffLogin = async () => {
    try {
      const profile = await liff.getProfile();
      console.log("LIFF Profile:", profile);

      const response = await lineLogin(profile);

      // Store Token and User Data
      localStorage.setItem("token", response.token);
      localStorage.setItem("user_id", response.data._id);
      localStorage.setItem("username", `${response.data.first_name}`);
      localStorage.setItem("role", response.data.role_id);

      // Store LINE login indicator for auto-logout purposes
      localStorage.setItem("loginMethod", "line");

      message.success("LINE login successful!");

      // Redirect based on role
      if (response.data.role_id === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error during Line login:", error);
      setError("Login failed. Please try again.");
      setLoading(false);

      // Redirect to regular login on error
      setTimeout(() => {
        navigate("/auth/signin");
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-pink-100 via-pink-200 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">
            Processing LINE login...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-pink-100 via-pink-200 to-purple-100">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Login Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate("/auth/signin")}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Login Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-b from-pink-100 via-pink-200 to-purple-100">
      <div className="text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-green-600">Login Successful</h1>
        <p className="text-gray-700">Redirecting...</p>
      </div>
    </div>
  );
};

export default Line;
