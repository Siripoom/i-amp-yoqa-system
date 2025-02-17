import React, { useState } from "react";
import { Button, Input, Upload, Form, Typography, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom"; // ใช้ navigate
const { Title, Text } = Typography;
import image from "../assets/images/imageC1.png";

const Checkout = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate(); // ใช้เพื่อเปลี่ยนหน้า

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields(); // ตรวจสอบข้อมูล
      console.log("Form Values:", values);
      message.success("Order placed successfully!");
      navigate("/cartSuccess"); // เปลี่ยนหน้าไป cartSuccess
    } catch (error) {
      message.error(
        "Please complete all required fields, including uploading the payment slip."
      );
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(to bottom, #FEADB4 10%, #FFFFFF 56%, #B3A1DD 100%)",
      }}
    >
      <Navbar />
      <div className="container mx-auto py-12 px-6">
        <Title level={3} className="mb-6">
          Billing details
        </Title>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Section: Form */}
          <div className="flex-1 bg-white p-6 rounded-md shadow-md">
            <Form form={form} layout="vertical">
              {/* Payment Section */}
              <div className="bg-gray-100 p-4 rounded-md mb-6">
                <Title level={4}>Payment Details</Title>
                <Text>Bank Name: XYZ Bank</Text>
                <br />
                <Text>Account Number: 123-456-7890</Text>
                <br />
                <Text>Account Name: IAMYOGA</Text>
                <br />
              </div>

              {/* Upload Payment Slip */}
              <Form.Item
                name="paymentSlip"
                label="Upload Payment Slip"
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                rules={[
                  {
                    required: true,
                    message: "Please upload your payment slip",
                  },
                ]}
              >
                <Upload
                  name="paymentSlip"
                  listType="picture"
                  beforeUpload={() => false} // Prevent automatic upload
                >
                  <Button icon={<UploadOutlined />}>Click to Upload</Button>
                </Upload>
              </Form.Item>

              {/* Submit Button */}
              <Form.Item>
                <Button
                  type="primary"
                  className="bg-pink-400 text-white w-full"
                  onClick={handleFormSubmit} // ตรวจสอบก่อนส่ง
                >
                  Buy
                </Button>
              </Form.Item>
            </Form>
          </div>

          {/* Right Section: Product Details */}
          <div className="flex-1 lg:w-1/3 bg-white p-6 rounded-md shadow-md">
            <Title level={4} className="mb-4">
              Order Summary
            </Title>
            {/* Product Item */}
            <div className="flex items-center gap-4 mb-4">
              <img
                src={image} // Mockup image
                alt="Product"
                className="w-24 h-24 rounded-md"
              />
              <div>
                <Text className="block font-semibold">Session: 20</Text>
              </div>
            </div>

            {/* Price Details */}
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <Text>Total</Text>
                <Text>฿999.00</Text>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
