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
      message.success('Password reset token generated successfully!');
      setCurrentStep(1);
    } catch (error) {
      console.error("Request reset failed:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Failed to request password reset. Please try again.");
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
      message.success('Password reset successfully!');
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
        message.error("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resetToken);
    message.success('Token copied to clipboard!');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <Card className="shadow-xl rounded-2xl">
          <div className="text-center mb-6">
            <Title level={2} className="text-gray-800 mb-2">
              Reset Password
            </Title>
            <Text className="text-gray-600">
              Follow the steps below to reset your password
            </Text>
          </div>

          <Steps current={currentStep} className="mb-8">
            <Step title="Request Reset" icon={<MailOutlined />} />
            <Step title="Enter Token" icon={<KeyOutlined />} />
            <Step title="Success" icon={<LockOutlined />} />
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
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" }
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-gray-400" />}
                  placeholder="Enter your email address"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
              >
                Request Password Reset
              </Button>
            </Form>
          )}

          {/* Step 2: Show Token and Reset Password Form */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Alert
                message="Reset Token Generated"
                description={
                  <div className="space-y-3">
                    <Text>Your password reset token has been generated. Please copy the token below:</Text>
                    <div className="bg-gray-100 p-3 rounded-lg break-all font-mono text-sm">
                      {resetToken}
                    </div>
                    <Button 
                      onClick={copyToClipboard}
                      size="small"
                      type="dashed"
                      className="w-full"
                    >
                      Copy Token
                    </Button>
                    <Text type="warning" className="block text-xs">
                      Note: In a real application, this token would be sent to your email address.
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
                  label="Reset Token"
                  name="resetToken"
                  rules={[{ required: true, message: "Please input the reset token!" }]}
                >
                  <Input
                    prefix={<KeyOutlined className="text-gray-400" />}
                    placeholder="Paste your reset token here"
                    size="large"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  label="New Password"
                  name="newPassword"
                  rules={[
                    { required: true, message: "Please input your new password!" },
                    { min: 6, message: "Password must be at least 6 characters long!" }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Enter your new password"
                    size="large"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  label="Confirm New Password"
                  name="confirmPassword"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: "Please confirm your new password!" },
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
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Confirm your new password"
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
                    className="w-full rounded-lg bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
                  >
                    Reset Password
                  </Button>
                  
                  <Button
                    type="default"
                    onClick={() => setCurrentStep(0)}
                    size="large"
                    className="w-full rounded-lg"
                  >
                    Back to Email Step
                  </Button>
                </Space>
              </Form>
            </div>
          )}

          {/* Step 3: Success Message */}
          {currentStep === 2 && (
            <div className="text-center space-y-4">
              <div className="text-6xl text-green-500 mb-4">✅</div>
              <Title level={3} className="text-green-600">
                Password Reset Successful!
              </Title>
              <Text className="text-gray-600 block mb-4">
                Your password has been successfully reset. You will be redirected to the login page shortly.
              </Text>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/auth/signin')}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
              >
                Go to Login Page
              </Button>
            </div>
          )}

          <div className="text-center mt-6">
            <Text className="text-gray-500">
              Remember your password?{" "}
              <Link to="/auth/signin" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign In
              </Link>
            </Text>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
