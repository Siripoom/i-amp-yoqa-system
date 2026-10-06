import React, { useState } from 'react';
import { Button, Form, Input, Typography, message, Card, Space, Steps, Alert } from "antd";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { MailOutlined, LockOutlined, KeyOutlined } from "@ant-design/icons";
import { requestPasswordReset, resetPassword } from "../services/authService";

const { Title, Text } = Typography;
const { Step } = Steps;

export const ResetPassword = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  // Step 1: Request password reset
  const onRequestReset = async (values) => {
    setLoading(true);
    try {
      const response = await requestPasswordReset(values.email);
      setResetToken(response.resetToken);
      message.success('สร้างโทเคนตั้งรหัสผ่านใหม่สำเร็จ');
      setCurrentStep(1);
    } catch (error) {
      console.error("Request reset failed:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("ขอตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองอีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password with token
  const onResetPassword = async (values) => {
    setLoading(true);
    try {
      await resetPassword(values.resetToken, values.newPassword);
      message.success('ตั้งรหัสผ่านใหม่สำเร็จ');
      setCurrentStep(2);
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/auth/signin');
      }, 2000);
    } catch (error) {
      console.error("Reset password failed:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("ตั้งรหัสผ่านใหม่ไม่สำเร็จ กรุณาลองอีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resetToken);
    message.success('คัดลอกโทเคนแล้ว');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <Card className="shadow-xl rounded-2xl">
          <div className="text-center mb-6">
            <Title level={2} className="text-text mb-2">
              ตั้งรหัสผ่านใหม่
            </Title>
            <Text className="text-secondary">
              ทำตามขั้นตอนต่อไปนี้เพื่อตั้งรหัสผ่านใหม่
            </Text>
          </div>

          <Steps current={currentStep} className="mb-8">
            <Step title="ขอตั้งรหัสผ่านใหม่" icon={<MailOutlined />} />
            <Step title="ระบุโทเคน" icon={<KeyOutlined />} />
            <Step title="สำเร็จ" icon={<LockOutlined />} />
          </Steps>

          {/* Step 1: Request Password Reset */}
          {currentStep === 0 && (
            <Form
              name="request-reset"
              onFinish={onRequestReset}
              layout="vertical"
              className="space-y-4"
            >
              <Form.Item
                label="อีเมล"
                name="email"
                rules={[
                  { required: true, message: "กรุณาระบุอีเมล" },
                  { type: "email", message: "กรุณาระบุอีเมลที่ถูกต้อง" }
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-secondary" />}
                  placeholder="ระบุอีเมลของคุณ"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className="w-full rounded-lg bg-primary hover:bg-primary-dark border-primary hover:border-primary"
              >
                ขอตั้งรหัสผ่านใหม่
              </Button>
            </Form>
          )}

          {/* Step 2: Show Token and Reset Password Form */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Alert
                message="สร้างโทเคนตั้งรหัสผ่านใหม่แล้ว"
                description={
                  <div className="space-y-3">
                    <Text>สร้างโทเคนตั้งรหัสผ่านใหม่แล้ว กรุณาคัดลอกโทเคนด้านล่าง:</Text>
                    <div className="bg-surface p-3 rounded-lg break-all font-mali text-sm">
                      {resetToken}
                    </div>
                    <Button
                      onClick={copyToClipboard}
                      size="small"
                      type="dashed"
                      className="w-full"
                    >
                      คัดลอกโทเคน
                    </Button>
                    <Text type="warning" className="block text-xs">
                      หมายเหตุ: ระบบจริงจะส่งโทเคนนี้ไปยังอีเมลของคุณ
                    </Text>
                  </div>
                }
                type="info"
                showIcon
                className="mb-4"
              />

              <Form
                name="reset-password"
                onFinish={onResetPassword}
                layout="vertical"
                className="space-y-4"
                initialValues={{ resetToken }}
              >
                <Form.Item
                  label="โทเคนตั้งรหัสผ่านใหม่"
                  name="resetToken"
                  rules={[{ required: true, message: "กรุณาระบุโทเคน" }]}
                >
                  <Input
                    prefix={<KeyOutlined className="text-secondary" />}
                    placeholder="วางโทเคนที่นี่"
                    size="large"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  label="รหัสผ่านใหม่"
                  name="newPassword"
                  rules={[
                    { required: true, message: "กรุณาระบุรหัสผ่านใหม่" },
                    { min: 6, message: "Password must be at least 6 characters long!" }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-secondary" />}
                    placeholder="ระบุรหัสผ่านใหม่"
                    size="large"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  label="ยืนยันรหัสผ่านใหม่"
                  name="confirmPassword"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: "กรุณายืนยันรหัสผ่านใหม่" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('The two passwords do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-secondary" />}
                    placeholder="ยืนยันรหัสผ่านใหม่"
                    size="large"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Space className="w-full" direction="vertical">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    className="w-full rounded-lg bg-success hover:bg-success border-success hover:border-success"
                  >
                    ตั้งรหัสผ่านใหม่
                  </Button>

                  <Button
                    type="default"
                    onClick={() => setCurrentStep(0)}
                    size="large"
                    className="w-full rounded-lg"
                  >
                    กลับไปขั้นตอนอีเมล
                  </Button>
                </Space>
              </Form>
            </div>
          )}

          {/* Step 3: Success Message */}
          {currentStep === 2 && (
            <div className="text-center space-y-4">
              <div className="text-6xl text-success mb-4">✅</div>
              <Title level={3} className="text-success">
                ตั้งรหัสผ่านใหม่สำเร็จ
              </Title>
              <Text className="text-secondary block mb-4">
                ตั้งรหัสผ่านใหม่สำเร็จ ระบบจะพาคุณไปหน้าเข้าสู่ระบบ
              </Text>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/auth/signin')}
                className="rounded-lg bg-primary hover:bg-primary-dark border-primary hover:border-primary"
              >
                ไปหน้าเข้าสู่ระบบ
              </Button>
            </div>
          )}

          <div className="text-center mt-6">
            <Text className="text-secondary">
              Remember your password?{" "}
              <Link to="/auth/signin" className="text-primary hover:text-primary font-medium">
                เข้าสู่ระบบ
              </Link>
            </Text>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
