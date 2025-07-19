import { Button, Checkbox, Form, Input, Typography, message, Alert } from "antd";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { LockOutlined, UserOutlined, LineOutlined } from "@ant-design/icons";
import { login, lineLogin } from "../services/authService";
import { useEffect, useState } from "react";
import liff from "@line/liff";
const { Title, Text } = Typography;

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    setError("");
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

      message.success("Login successful!");

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
        
        switch (statusCode) {
          case 404:
            setError("Email not found. Please check your email or sign up.");
            message.error("Email not found");
            break;
          case 401:
            setError("Incorrect password. Please try again.");
            message.error("Incorrect password");
            break;
          case 400:
            setError("Invalid email or password format.");
            message.error("Invalid credentials");
            break;
          default:
            setError("Login failed. Please try again.");
            message.error("Login failed");
        }
      } else if (error.request) {
        setError("Cannot connect to server. Please check your internet connection.");
        message.error("Connection error");
      } else {
        setError("An unexpected error occurred. Please try again.");
        message.error("Login error");
      }
    } finally {
      setLoading(false);
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
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            className="mb-4"
            closable
            onClose={() => setError("")}
          />
        )}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please enter your username!" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter your password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <div className="flex justify-between items-center mb-4">
            <Checkbox>Remember Me</Checkbox>
            <Link className="text-blue-600">Forget Password</Link>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white text-lg flex justify-center items-center py-2 rounded-3xl"
          >
            {loading ? "Signing in..." : "Sign In →"}
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
            Login with LINE
          </Button>
        </div>

        {/* Sign up link */}
        <div className="text-center mt-4">
          <Text>Don&apos;t have an account?</Text>{" "}
          <Link to="/auth/signup" className="text-blue-600">
            Sign Up
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SignIn;