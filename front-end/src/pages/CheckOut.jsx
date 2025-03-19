import React, { useState, useEffect } from "react";
import { Button, Upload, Form, Typography, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import orderService from "../services/orderService";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
const { Title, Text } = Typography;
import image from "../assets/images/imageC1.png";
import qr from "../assets/15000.jpg";
const Checkout = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (location.state?.product) {
      setProduct(location.state.product);
    } else {
      message.error("No product selected. Redirecting...");
      navigate("/course"); // กลับไปหน้า Course ถ้าไม่มีสินค้า
    }
  }, [location, navigate]);

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formData = new FormData();
      formData.append("user_id", localStorage.getItem("user_id")); // ใส่ User ID จริงจาก Auth
      formData.append("product_id", product._id);
      if (values.paymentSlip?.length > 0) {
        formData.append("image", values.paymentSlip[0].originFileObj);
      }

      await orderService.createOrder(formData);
      message.success("Order placed successfully!");
      navigate("/cartSuccess");
    } catch (error) {
      message.error(error.message || "Order failed. Please try again.");
    } finally {
      setLoading(false);
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
                <Text>Bank Name: กสิกรไทย</Text>
                <br />
                <Text>Account Number: 180-820-700-8</Text>
                <br />
                <Text>Account Name: น.ส. อริจรา แท่นประเสริฐกุล</Text>
                <br />
              </div>
              {/* show qwr code picture */}
              <div className="bg-gray-100 p-4 rounded-md mb-6 ">
                <img
                  src={qr}
                  alt="QR Code"
                  className="w-64 h-auto rounded-md"
                />
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
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />}>Click to Upload</Button>
                </Upload>
              </Form.Item>

              {/* Submit Button */}
              <Form.Item>
                <Button
                  type="primary"
                  className="bg-pink-400 text-white w-full"
                  onClick={handleFormSubmit}
                  loading={loading}
                >
                  Buy
                </Button>
              </Form.Item>
            </Form>
          </div>

          {/* Right Section: Product Details */}
          {product && (
            <div className="flex-1 lg:w-1/3 bg-white p-6 rounded-md shadow-md">
              <Title level={4} className="mb-4">
                Order Summary
              </Title>
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={image}
                  alt="Product"
                  className="w-24 h-24 rounded-md"
                />
                <div>
                  <Text className="block font-semibold">
                    Session: {product.sessions}
                  </Text>
                  <Text className="block text-red-600 font-semibold">
                    {product.price} THB
                  </Text>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
