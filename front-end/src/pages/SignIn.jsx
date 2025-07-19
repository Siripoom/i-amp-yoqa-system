import { Button, Checkbox, Form, Input, Typography, message, Alert } from "antd";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { login } from "../services/authService";
import { useEffect, useState } from "react";
import liff from "@line/liff";

const { Title, Text } = Typography;

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    liff.init({ liffId: "2007091295-9VRjXwVY" });
  }, []);

  const handleLiffLogin = async () => {
    try {
      liff.login();
    } catch (error) {
      console.error("LIFF login failed:", error);
      message.error("LIFF login failed. Please try again.");
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    setError(""); // Clear previous errors
    
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
      localStorage.setItem("role", response.data.role_id);

      // Show success message
      message.success("เข้าสู่ระบบสำเร็จ!");

      // Redirect based on role
      if (response.data.role_id === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error);
      
      // Handle different types of errors
      if (error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message;
        
        switch (statusCode) {
          case 404:
            setError("ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิกใหม่");
            message.error("ไม่พบอีเมลนี้ในระบบ");
            break;
          case 401:
            setError("รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านอีกครั้ง");
            message.error("รหัสผ่านไม่ถูกต้อง");
            break;
          case 400:
            setError("ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีเมลและรหัสผ่าน");
            message.error("ข้อมูลไม่ถูกต้อง");
            break;
          default:
            setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
            message.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        }
      } else if (error.request) {
        setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
        message.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      } else {
        setError("เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง");
        message.error("เกิดข้อผิดพลาดที่ไม่คาดคิด");
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear error when user starts typing
  const handleInputChange = () => {
    if (error) {
      setError("");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          "linear-gradient(to bottom, #FEADB4 10%, #FFFFFF 56%, #B3A1DD 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-white p-8 rounded-2xl shadow-lg w-96"
      >
        <Title level={2} className="text-center text-blue-900 font-bold">
          Sign-In
        </Title>
        
        {/* Error Alert */}
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError("")}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form 
          form={form}
          layout="vertical" 
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "กรุณากรอกอีเมล!" },
              { type: "email", message: "กรุณากรอกอีเมลให้ถูกต้อง!" }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="อีเมล" 
              size="large"
              onChange={handleInputChange}
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "กรุณากรอกรหัสผ่าน!" },
              { min: 6, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร!" }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="รหัสผ่าน"
              size="large"
              onChange={handleInputChange}
              autoComplete="current-password"
            />
          </Form.Item>

          <div className="flex justify-between items-center mb-4">
            <Checkbox>จำฉันไว้</Checkbox>
            <Link className="text-blue-600 hover:text-blue-800">ลืมรหัสผ่าน?</Link>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white text-lg flex justify-center items-center py-2 rounded-3xl border-0"
            size="large"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ →"}
          </Button>
        </Form>

        {/* Centered LINE login button */}
        <div className="flex justify-center mt-4">
          <Button
            type="primary"
            onClick={handleLiffLogin}
            disabled={loading}
            style={{
              backgroundColor: "#00C300",
              borderColor: "#00C300",
              color: "white",
              fontWeight: "bold",
              padding: "12px 24px",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
            }}
          >
            เข้าสู่ระบบด้วย LINE
          </Button>
        </div>

        {/* Sign up link */}
        <div className="text-center mt-4">
          <Text>ยังไม่มีบัญชี?</Text>{" "}
          <Link to="/auth/signup" className="text-blue-600 hover:text-blue-800">
            สมัครสมาชิก
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SignIn;