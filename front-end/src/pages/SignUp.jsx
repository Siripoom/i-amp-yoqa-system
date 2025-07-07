import { useState } from "react";
import {
  Button,
  Form,
  Input,
  Typography,
  Select,
  DatePicker,
  message,
} from "antd";
import { motion } from "framer-motion";
import {
  LockOutlined,
  UserOutlined,
  PhoneOutlined,
  HomeOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import IampYogaTermsForm from "../components/IampYogaTermsForm";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;

const SignUp = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // แปลงวันเกิดเป็นรูปแบบ YYYY-MM-DD
      const formattedValues = {
        ...values,
        birth_date: dayjs(values.birth_date).format("YYYY-MM-DD"),
      };

      const response = await register(formattedValues);

      message.success("Registration successful! Redirecting...");
      setTimeout(() => navigate("/auth/signin"), 2000);
    } catch (error) {
      message.error(error.response?.data?.message || "Registration failed");
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
          Sign-Up
        </Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="first_name"
            rules={[{ required: true, message: "First name is required" }]}
          >
            <Input placeholder="Firstname" size="large" />
          </Form.Item>

          <Form.Item
            name="last_name"
            rules={[{ required: true, message: "Last name is required" }]}
          >
            <Input placeholder="Lastname" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            rules={[
              { required: true, message: "Phone number is required" },
              { pattern: /^[0-9]{10}$/, message: "Enter a valid phone number" },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Phone"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="birth_date"
            rules={[{ required: true, message: "Birth date is required" }]}
          >
            <DatePicker
              placeholder="Select Birth Date"
              size="large"
              className="w-full"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          {/* <Form.Item
            name="address"
            rules={[{ required: true, message: "Address is required" }]}
          >
            <Input
              prefix={<HomeOutlined />}
              placeholder="Address"
              size="large"
            />
          </Form.Item> */}

          <Form.Item name="referrer_id">
            <Input placeholder="Referrer ID (ถ้ามี)" size="large" />
          </Form.Item>

          {/* <Form.Item name="special_rights">
            <Input
              placeholder="Special Rights (สิทธิพิเศษ)"
              size="large"
              defaultValue="Free class on birthday"
            />
          </Form.Item> */}

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white text-lg flex justify-center items-center py-2 rounded-3xl"
          >
            Sign Up →
          </Button>

          <div className="text-center mt-4">
            <Link to="/auth/signin" className="text-blue-600">
              Cancel
            </Link>
          </div>
        </Form>
      </motion.div>
    </div>
  );
};

export default SignUp;
