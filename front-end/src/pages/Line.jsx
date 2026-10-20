import { useCallback, useEffect, useState } from "react";
import liff from "@line/liff";
import { lineLogin } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

const loginErrors = {
  LINE_LEGACY_ACCOUNT_REVIEW_REQUIRED:
    "บัญชี LINE เดิมของคุณต้องให้ผู้ดูแลตรวจสอบและเชื่อมต่อข้อมูลสมาชิกก่อน กรุณาติดต่อสตูดิโอ ไม่ต้องสมัครบัญชีใหม่",
  LINE_IDENTITY_CONFLICT:
    "บัญชี LINE นี้มีข้อมูลสมาชิกซ้ำ กรุณาติดต่อสตูดิโอเพื่อตรวจสอบ",
  LINE_ID_TOKEN_INVALID:
    "การเข้าสู่ระบบ LINE หมดอายุหรือไม่ถูกต้อง กรุณาปิดหน้านี้แล้วเข้าสู่ระบบผ่าน LINE อีกครั้ง",
  LINE_IDENTITY_NOT_CONFIGURED:
    "ระบบเข้าสู่ระบบ LINE ยังไม่พร้อมใช้งาน กรุณาติดต่อสตูดิโอ",
  LINE_IDENTITY_UNAVAILABLE:
    "ไม่สามารถเชื่อมต่อ LINE ได้ชั่วคราว กรุณาลองใหม่อีกครั้ง",
};

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

      message.success("เข้าสู่ระบบด้วย LINE สำเร็จ");

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
    } catch (error) {
      console.error("LINE login request failed");
      setError(
        loginErrors[error?.response?.data?.code] ||
          "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หากยังเข้าไม่ได้ กรุณาติดต่อสตูดิโอ"
      );
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: import.meta.env.VITE_LINE_LIFF });

        if (liff.isLoggedIn()) {
          await handleLiffLogin();
        } else {
          liff.login();
        }
      } catch {
        console.error("LIFF initialization or login failed");
        setError("ไม่สามารถเริ่มเข้าสู่ระบบ LINE ได้ กรุณาลองใหม่อีกครั้ง");
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
            กำลังเข้าสู่ระบบด้วย LINE...
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
          <h1 className="text-2xl font-bold text-error mb-2">เข้าสู่ระบบไม่สำเร็จ</h1>
          <p className="text-text mb-6">{error}</p>
          <button
            onClick={() => navigate("/auth/signin")}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded"
          >
            ไปหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-surface">
      <div className="text-center">
        <div className="text-success text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-success">เข้าสู่ระบบสำเร็จ</h1>
        <p className="text-text">กำลังเปลี่ยนหน้า...</p>
      </div>
    </div>
  );
};

export default Line;
