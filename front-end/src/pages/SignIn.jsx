import { Button, Form, Input, Typography, message } from "antd";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { login } from "../services/authService";
import { useEffect } from "react";
import liff from "@line/liff";
const { Title, Text } = Typography;

const SignIn = () => {
  useEffect(() => {
    liff.init({ liffId: import.meta.env.VITE_LINE_LIFF });
  }, []);

  const handleLiffLogin = async () => {
    try {
      liff.login();
    } catch (error) {
      console.error("LIFF login failed:", error);
      message.error("เข้าสู่ระบบด้วย LINE ไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  };

  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const { username, password } = values;
      const response = await login(username, password);

      // Store Token and User Data
      localStorage.setItem("token", response.token);
      localStorage.setItem("user_id", response.data._id);
      localStorage.setItem(
        "username",
        `${response.data.first_name} ${response.data.last_name}`
      );
      localStorage.setItem("role", response.data.role_id); // Store user role

      // Debug: Log the role received from backend
      console.log("User role from backend:", response.data.role_id);

      // Redirect based on role
      if (response.data.role_id === "Admin" ||
          response.data.role_id === "SuperAdmin" ||
          response.data.role_id === "Accounting") {
        console.log("Redirecting to admin dashboard...");
        navigate("/admin/dashboard");
      } else {
        console.log("Redirecting to home...");
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error);

      // Handle different error scenarios and show user-friendly messages
      if (error.response) {
        // Server responded with error status
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message || "เข้าสู่ระบบไม่สำเร็จ";

        switch (statusCode) {
          case 404:
            message.error("ไม่พบอีเมล กรุณาตรวจสอบหรือสมัครสมาชิก");
            break;
          case 401:
            message.error("รหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง");
            break;
          case 400:
            message.error("รูปแบบอีเมลหรือรหัสผ่านไม่ถูกต้อง");
            break;
          case 500:
            message.error("เซิร์ฟเวอร์ขัดข้อง กรุณาลองอีกครั้งภายหลัง");
            break;
          default:
            message.error(`เข้าสู่ระบบไม่สำเร็จ: ${errorMessage}`);
        }
      } else if (error.request) {
        // Network error
        message.error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต");
      } else {
        // Other error
        message.error("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
      }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          "var(--color-background)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white p-8 rounded-2xl shadow-lg w-96"
      >
        <Title level={2} className="text-center text-primary font-bold">
          เข้าสู่ระบบ
        </Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: "กรุณาระบุชื่อผู้ใช้" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="อีเมล" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "กรุณาระบุรหัสผ่าน" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="รหัสผ่าน"
              size="large"
            />
          </Form.Item>

          {/* <div className="flex justify-between items-center mb-4">
            <Checkbox>จดจำฉัน</Checkbox>
            <Link className="text-primary">ลืมรหัสผ่าน</Link>
          </div> */}

          <Button
            type="primary"
            htmlType="submit"
            className="w-full bg-primary text-white text-lg flex justify-center items-center py-2 rounded-3xl"
          >
            Sign In →
          </Button>
        </Form>

        {/* Centered LINE login button */}
        <div
          className="flex justify-center mt-4"
          style={{ alignItems: "center" }}
        >
          <Button
            type="primary"
            // icon={<LineOutlined />} // Adds the LINE icon
            onClick={handleLiffLogin}
            style={{
              backgroundColor: "#00C300", // LINE's signature green color
              borderColor: "#00C300", // Keep the border the same as the button
              color: "white", // Text color
              fontWeight: "bold", // Makes the text bold
              padding: "12px 24px", // Gives the button some padding
              fontSize: "16px", // Ensures text size is large enough
              display: "flex", // For centering the icon and text
              alignItems: "center", // Centering icon and text vertically
            }}
          >
            เข้าสู่ระบบด้วย LINE
          </Button>
        </div>

        {/* Sign up link */}
        <div className="text-center mt-4">
          <Text>Don&apos;t have an account?</Text>{" "}
          <Link to="/auth/signup" className="text-primary">
            สมัครสมาชิก
          </Link>
        </div>

        {/* Forgot password link */}
        <div className="text-center mt-2">
          <Link to="/auth/reset-password" className="text-secondary hover:text-primary">
            ลืมรหัสผ่าน?
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SignIn;
