import { useState, useEffect } from "react";
import {
  Button,
  Upload,
  Form,
  Typography,
  message,
  InputNumber,
  Divider,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import orderService from "../services/orderService";
import { QrcodePayment } from "../services/imageService";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
const { Title, Text } = Typography;
import image from "../assets/images/imageC1.png";

const Checkout = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [qr, setQr] = useState(null); // State for QR code image
  const [quantity, setQuantity] = useState(1); // State for quantity

  // Calculate total price and duration based on quantity
  const totalPrice = product ? product.price * quantity : 0;
  const totalDuration = product ? product.duration * quantity : 0;
  const totalSessions = product ? product.sessions * quantity : 0;

  useEffect(() => {
    if (location.state?.product) {
      setProduct(location.state.product);
      // Create an async function inside the useEffect
      const fetchQrCode = async () => {
        try {
          const response = await QrcodePayment.getQrcodePayment();
          // Check if response.data is an array and get the first item's image URL
          if (Array.isArray(response.data) && response.data.length > 0) {
            setQr(response.data[0].image);
          } else {
            message.error("QR code data not found");
          }
        } catch (error) {
          message.error("Failed to load QR code");
          console.error(error);
        }
      };

      fetchQrCode();
    } else {
      message.error("No product selected. Redirecting...");
      navigate("/course"); // กลับไปหน้า Course ถ้าไม่มีสินค้า
    }
  }, [location, navigate]);

  // Handle quantity change
  const handleQuantityChange = (value) => {
    // Make sure value is a number and at least 1
    const newQuantity = Math.max(1, Number(value) || 1);
    setQuantity(newQuantity);
  };

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

      // Add quantity and calculated totals to the form data
      formData.append("quantity", quantity);
      formData.append("total_price", totalPrice);
      formData.append("total_duration", totalDuration);
      formData.append("total_sessions", totalSessions);

      const response = await orderService.createOrder(formData);
      message.success("Order placed successfully!");
      navigate("/cartSuccess", { state: { orderData: response.data } });
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
                <Text>ชำระค่าบริการช่องทางอื่นๆติดต่อได้ที่ไลน์ @iampyoqa</Text>
                {/* <br />
                <Text>Bank : กสิกรไทย</Text>
                <br />
                <Text>180-820-700-8</Text>
                <br />
                <Text>Account : น.ส. อริจรา แท่นประเสริฐกุล</Text>
                <br /> */}
              </div>
              {/* show qwr code picture */}
              <div className="bg-gray-100 p-4 rounded-md mb-6 ">
                {qr && (
                  <img
                    src={qr}
                    alt="QR Code"
                    className="w-64 h-auto rounded-md"
                  />
                )}
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
                  src={product.image || image}
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

              {/* Quantity Selector */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <Text strong>จำนวน:</Text>
                  <InputNumber
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={handleQuantityChange}
                    style={{ width: "120px" }}
                  />
                </div>
                <Text type="secondary" className="block mb-4 text-xs">
                  * การซื้อจำนวนมากกว่า 1 รายการ จะรวมระยะเวลาใช้งานเข้าด้วยกัน
                </Text>
              </div>

              <Divider className="my-4" />

              {/* Order Details */}
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <Text>ราคาต่อชิ้น:</Text>
                  <Text>{product.price} THB</Text>
                </div>
                <div className="flex justify-between mb-2">
                  <Text>จำนวนคลาสต่อชิ้น:</Text>
                  <Text>{product.sessions} sessions</Text>
                </div>
                <div className="flex justify-between mb-2">
                  <Text>ระยะเวลาต่อชิ้น:</Text>
                  <Text>{product.duration} วัน</Text>
                </div>
                <div className="flex justify-between mb-2">
                  <Text>จำนวน:</Text>
                  <Text>{quantity} ชิ้น</Text>
                </div>

                <Divider className="my-2" />

                <div className="flex justify-between mb-2">
                  <Text strong>รวมจำนวนคลาส:</Text>
                  <Text strong>{totalSessions} sessions</Text>
                </div>
                <div className="flex justify-between mb-2">
                  <Text strong>รวมระยะเวลา:</Text>
                  <Text strong>{totalDuration} วัน</Text>
                </div>
                <div className="flex justify-between mt-4 bg-pink-50 p-2 rounded-md">
                  <Text strong className="text-red-600">
                    ราคาสุทธิ:
                  </Text>
                  <Text strong className="text-red-600 text-xl">
                    {totalPrice} THB
                  </Text>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  * ระยะเวลาการใช้งานจะเริ่มนับหลังจากการใช้งานครั้งแรก
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
