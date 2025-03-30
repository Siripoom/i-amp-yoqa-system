import { useEffect, useState } from "react";
import liff from "@line/liff";
import { lineLogin } from "../services/authService";
import { useNavigate } from "react-router-dom";

const Line = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: "2007091295-9VRjXwVY" });
        if (liff.isLoggedIn()) {
          await handleLiffLogin();
        }
      } catch (error) {
        console.error("LIFF initialization failed:", error);
      }
    };
    initLiff();
  }, []);

  const handleLiffLogin = async () => {
    try {
      const profile = await liff.getProfile();
      await lineLogin(profile)
        .then((response) => {
          // Store Token and User Data
          localStorage.setItem("token", response.token);
          localStorage.setItem("user_id", response.data._id);
          localStorage.setItem("username", `${response.data.first_name}`);
          localStorage.setItem("role", response.data.role_id);

          // Redirect based on role
          if (response.data.role_id === "Admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/");
          }
        })
        .catch((error) => {
          console.error("Error during Line login:", error);
          loading(false);
        });
    } catch (error) {
      console.error("LIFF login failed:", error);
    }
  };

  return loading ? (
    <div className="flex items-center justify-center h-screen">
      <div className="loader"></div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-screen">
      <h1>Login Successful</h1>
    </div>
  );
};

export default Line;
