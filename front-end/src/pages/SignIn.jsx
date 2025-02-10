import { Button, Checkbox, Form, Input, Typography } from "antd";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { login } from "../services/authService";

const { Title, Text } = Typography;

const SignIn = () => {
  const onFinish = async (values) => {
    try {
      // console.log(values);
      const { username, password } = values;
      const response = await login(username, password);
      // console.log("Login successful:", response);
      // Example: Store token or redirect
      localStorage.setItem("token", response.token);
      // window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login failed:", error);
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
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please enter your username!" }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
              size="large"
            />
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
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white text-lg flex justify-center items-center py-2 rounded-3xl"
          >
            Sign In →
          </Button>
        </Form>

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
