import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  InputNumber,
  Card,
  Form,
  Input,
  message,
  Spin,
  Typography,
} from "antd";
import { QrcodePayment } from "../services/imageService";
import orderService from "../services/orderService";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const { Title, Text } = Typography;

const CheckOut = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [form] = Form.useForm();

  // Use location state to get product data passed from the previous page
  const product = location.state?.product;

  // Calculate total price and duration based on quantity
  const totalPrice = product ? product.price * quantity : 0;
  const totalDuration = product ? product.duration * quantity : 0;

  useEffect(() => {
    if (!product) {
      message.error("No product selected. Redirecting to products page...");
      navigate("/product");
      return;
    }

    // Fetch QR code for payment
    const fetchQrCode = async () => {
      try {
        const response = await QrcodePayment.getQrcodePayment();
        if (response.data && response.data.length > 0) {
          setQrCode(response.data[0]);
        }
      } catch (error) {
        console.error("Error fetching QR code:", error);
        message.error("Could not load payment QR code");
      }
    };

    fetchQrCode();
  }, [navigate, product]);

  const handleQuantityChange = (value) => {
    setQuantity(value);
  };

  const onFinish = async (values) => {
    if (!product) {
      message.error("No product selected");
      return;
    }

    try {
      setLoading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("user_id", localStorage.getItem("user_id"));
      formData.append("product_id", product._id);

      if (
        values.image &&
        values.image.fileList &&
        values.image.fileList.length > 0
      ) {
        formData.append("image", values.image.fileList[0].originFileObj);
      }

      // Add quantity information to be used in the backend
      formData.append("quantity", quantity);

      const response = await orderService.createOrder(formData);

      if (response.status === "success") {
        message.success("Order created successfully!");
        navigate("/cartSuccess", { state: { orderData: response.data } });
      }
    } catch (error) {
      console.error("Order creation error:", error);
      message.error("Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  if (!product) {
    return <Spin tip="Loading..." />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="py-8 flex-grow">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Title level={2} className="text-center mb-8">
              Checkout
            </Title>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <Card title="Order Summary" className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Text strong>Product:</Text>
                      <Text className="block">{product.sessions} Sessions</Text>
                    </div>
                    <div>
                      <Text strong>Price:</Text>
                      <Text className="block">{product.price} THB</Text>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Text strong>Quantity:</Text>
                    <InputNumber
                      min={1}
                      max={10}
                      defaultValue={1}
                      onChange={handleQuantityChange}
                      className="w-full"
                    />
                  </div>

                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Text>Price per item:</Text>
                      <Text>{product.price} THB</Text>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <Text>Quantity:</Text>
                      <Text>{quantity}</Text>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <Text strong>Total Price:</Text>
                      <Text strong>{totalPrice} THB</Text>
                    </div>
                    <div className="flex items-center justify-between">
                      <Text strong>Total Duration:</Text>
                      <Text strong>{totalDuration} days</Text>
                    </div>
                  </div>
                </Card>

                {qrCode && (
                  <Card title="Payment QR Code">
                    <div className="flex justify-center mb-4">
                      <img
                        src={qrCode.image}
                        alt="Payment QR Code"
                        className="max-w-full h-auto"
                      />
                    </div>
                    <Text className="block text-center text-red-500">
                      Please scan this QR code to make your payment
                    </Text>
                  </Card>
                )}
              </div>

              <div>
                <Card title="Upload Payment Proof">
                  <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item
                      name="image"
                      label="Payment Receipt"
                      valuePropName="file"
                      getValueFromEvent={normFile}
                      rules={[
                        {
                          required: true,
                          message: "Please upload your payment receipt",
                        },
                      ]}
                    >
                      <Input type="file" accept="image/*" />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        className="w-full bg-gradient-to-r from-pink-500 to-red-400"
                      >
                        Submit Order
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckOut;
