import { useState, useEffect } from "react";
import {
  Button,
  Upload,
  Form,
  Typography,
  message,
  InputNumber,
  Divider,
  Select,
  Tag,
  Space,
} from "antd";
import {
  UploadOutlined,
  TagsOutlined,
  StockOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import orderService from "../services/orderService";
import { QrcodePayment } from "../services/imageService";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const { Title, Text } = Typography;
const { Option } = Select;
import image from "../assets/images/imageC1.png";

const Checkout = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState(null);
  const [orderType, setOrderType] = useState(null);
  const [qr, setQr] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // State สำหรับ goods options
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  // Calculate totals based on order type
  const calculateTotals = () => {
    if (!item) return { totalPrice: 0, totalDuration: 0, totalSessions: 0 };

    let unitPrice = item.price;

    // สำหรับ goods ที่มีโปรโมชั่น
    if (orderType === "goods" && item.promotion) {
      const now = new Date();
      const promotionStart = new Date(item.promotion.startDate);
      const promotionEnd = new Date(item.promotion.endDate);

      if (
        now >= promotionStart &&
        now <= promotionEnd &&
        item.promotion.price
      ) {
        unitPrice = item.promotion.price;
      }
    }

    // สำหรับ product ที่มีโปรโมชั่น
    if (
      orderType === "product" &&
      item.isPromotionActive &&
      item.promotion?.price
    ) {
      unitPrice = item.promotion.price;
    }

    const totalPrice = unitPrice * quantity;
    const totalDuration =
      orderType === "product" ? item.duration * quantity : 0;
    const totalSessions =
      orderType === "product" ? item.sessions * quantity : 0;

    return { totalPrice, totalDuration, totalSessions, unitPrice };
  };

  const { totalPrice, totalDuration, totalSessions, unitPrice } =
    calculateTotals();

  useEffect(() => {
    if (location.state?.item && location.state?.orderType) {
      setItem(location.state.item);
      setOrderType(location.state.orderType);

      // Set default size and color for goods
      if (location.state.orderType === "goods") {
        setSelectedSize(location.state.item.size || null);
        setSelectedColor(location.state.item.color || null);
      }

      // Fetch QR code
      const fetchQrCode = async () => {
        try {
          const response = await QrcodePayment.getQrcodePayment();
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
      message.error("No item selected. Redirecting...");
      navigate("/course");
    }
  }, [location, navigate]);

  // Handle quantity change
  const handleQuantityChange = (value) => {
    const newQuantity = Math.max(1, Number(value) || 1);

    // ตรวจสอบสต็อกสำหรับ goods
    if (orderType === "goods" && newQuantity > item.stock) {
      message.warning(`Only ${item.stock} items available in stock`);
      setQuantity(item.stock);
      return;
    }

    setQuantity(newQuantity);
  };

  // Check if promotion is active for goods
  const isGoodsPromotionActive = (promotion) => {
    if (!promotion || !promotion.startDate || !promotion.endDate) return false;
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);
    return now >= start && now <= end;
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Validate goods specific requirements
      if (orderType === "goods") {
        if (item.stock < quantity) {
          message.error("Insufficient stock available");
          return;
        }
      }

      setLoading(true);

      // Create FormData manually ให้ถูกต้อง
      const formData = new FormData();
      formData.append("user_id", localStorage.getItem("user_id"));
      formData.append("order_type", orderType);
      formData.append("quantity", quantity);

      // เพิ่มข้อมูลตาม order type
      if (orderType === "product") {
        formData.append("product_id", item._id);
      } else if (orderType === "goods") {
        formData.append("goods_id", item._id);
        if (selectedSize) formData.append("size", selectedSize);
        if (selectedColor) formData.append("color", selectedColor);
      }

      // เพิ่มไฟล์รูปภาพ
      if (values.paymentSlip && values.paymentSlip.length > 0) {
        const file = values.paymentSlip[0];
        if (file.originFileObj) {
          formData.append("image", file.originFileObj);
        } else if (file instanceof File) {
          formData.append("image", file);
        }
      }

      const response = await orderService.createOrder(formData);
      message.success(
        `${
          orderType === "product" ? "Course" : "Goods"
        } order placed successfully!`
      );
      navigate("/cartSuccess", {
        state: { orderData: response.data, orderType },
      });
    } catch (error) {
      message.error(error.message || "Order failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render item specific information
  const renderItemInfo = () => {
    if (!item) return null;

    if (orderType === "product") {
      return (
        <div>
          <Text className="block font-semibold">Session: {item.sessions}</Text>
          <Text className="block text-sm text-gray-600 mb-2">
            Duration: {item.duration} Days
          </Text>
          <div className="text-red-600 font-semibold">
            {item.isPromotionActive && item.promotion?.price ? (
              <div>
                <span className="text-red-600">
                  ฿{item.promotion.price.toLocaleString()}
                </span>
                <span className="text-gray-500 text-sm line-through ml-2">
                  ฿{item.price.toLocaleString()}
                </span>
              </div>
            ) : (
              `฿${item.price.toLocaleString()}`
            )}
          </div>
        </div>
      );
    } else if (orderType === "goods") {
      const hasActivePromotion = isGoodsPromotionActive(item.promotion);

      return (
        <div>
          <Text className="block font-semibold mb-1">{item.goods}</Text>
          {item.code && (
            <Text className="block text-xs text-gray-500 font-mono mb-2">
              Code: {item.code}
            </Text>
          )}

          {/* Tags */}
          <div className="mb-2 flex flex-wrap gap-1">
            {item.size && (
              <Tag color="geekblue" size="small">
                {item.size}
              </Tag>
            )}
            {item.color && (
              <Tag color="orange" size="small">
                {item.color}
              </Tag>
            )}
            {item.hotSale && (
              <Tag color="red" icon={<FireOutlined />} size="small">
                Hot Sale
              </Tag>
            )}
          </div>

          {/* Stock info */}
          <div className="mb-2">
            <Tag
              color={item.stock > 0 ? "green" : "red"}
              icon={<StockOutlined />}
              size="small"
            >
              Stock: {item.stock} {item.unit}
            </Tag>
          </div>

          <div className="text-red-600 font-semibold">
            {hasActivePromotion ? (
              <div>
                <span className="text-red-600">
                  ฿{item.promotion.price.toLocaleString()}
                </span>
                <span className="text-gray-500 text-sm line-through ml-2">
                  ฿{item.price.toLocaleString()}
                </span>
              </div>
            ) : (
              `฿${item.price.toLocaleString()}`
            )}
          </div>
        </div>
      );
    }
  };

  // Render order summary details
  const renderOrderSummary = () => {
    if (!item) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex justify-between mb-2">
          <Text>ราคาต่อชิ้น:</Text>
          <Text>฿{unitPrice.toLocaleString()}</Text>
        </div>

        {orderType === "product" && (
          <>
            <div className="flex justify-between mb-2">
              <Text>จำนวนคลาสต่อชิ้น:</Text>
              <Text>{item.sessions} sessions</Text>
            </div>
            <div className="flex justify-between mb-2">
              <Text>ระยะเวลาต่อชิ้น:</Text>
              <Text>{item.duration} วัน</Text>
            </div>
          </>
        )}

        {orderType === "goods" && (
          <>
            <div className="flex justify-between mb-2">
              <Text>หน่วย:</Text>
              <Text>{item.unit}</Text>
            </div>
            {selectedSize && (
              <div className="flex justify-between mb-2">
                <Text>ขนาดที่เลือก:</Text>
                <Text>{selectedSize}</Text>
              </div>
            )}
            {selectedColor && (
              <div className="flex justify-between mb-2">
                <Text>สีที่เลือก:</Text>
                <Text>{selectedColor}</Text>
              </div>
            )}
          </>
        )}

        <div className="flex justify-between mb-2">
          <Text>จำนวน:</Text>
          <Text>{quantity} ชิ้น</Text>
        </div>

        <Divider className="my-2" />

        {orderType === "product" && (
          <>
            <div className="flex justify-between mb-2">
              <Text strong>รวมจำนวนคลาส:</Text>
              <Text strong>{totalSessions} sessions</Text>
            </div>
            <div className="flex justify-between mb-2">
              <Text strong>รวมระยะเวลา:</Text>
              <Text strong>{totalDuration} วัน</Text>
            </div>
          </>
        )}

        <div className="flex justify-between mt-4 bg-pink-50 p-2 rounded-md">
          <Text strong className="text-red-600">
            ราคาสุทธิ:
          </Text>
          <Text strong className="text-red-600 text-xl">
            ฿{totalPrice.toLocaleString()}
          </Text>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          {orderType === "product"
            ? "* ระยะเวลาการใช้งานจะเริ่มนับหลังจากการใช้งานครั้งแรก"
            : "* สินค้าจะถูกจัดส่งหลังจากได้รับการยืนยันการชำระเงิน"}
        </div>
      </div>
    );
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
          Billing Details -{" "}
          {orderType === "product" ? "Course Order" : "Goods Order"}
        </Title>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Section: Form */}
          <div className="flex-1 bg-white p-6 rounded-md shadow-md">
            <Form form={form} layout="vertical">
              {/* Payment Section */}
              <div className="bg-gray-100 p-4 rounded-md mb-6">
                <Title level={4}>Payment Details</Title>
                <Text>ชำระค่าบริการช่องทางอื่นๆติดต่อได้ที่ไลน์ @iampyoqa</Text>
              </div>

              {/* QR Code */}
              <div className="bg-gray-100 p-4 rounded-md mb-6 ">
                {qr && (
                  <img
                    src={qr}
                    alt="QR Code"
                    className="w-64 h-auto rounded-md"
                  />
                )}
              </div>

              {/* Goods Options */}
              {orderType === "goods" && item && (
                <div className="mb-6">
                  <Title level={5}>Product Options</Title>

                  {/* Size Selection */}
                  {item.size && (
                    <Form.Item label="Size" className="mb-4">
                      <Select
                        value={selectedSize}
                        onChange={setSelectedSize}
                        placeholder="Select size"
                        style={{ width: "100%" }}
                      >
                        <Option value={item.size}>{item.size}</Option>
                      </Select>
                    </Form.Item>
                  )}

                  {/* Color Selection */}
                  {item.color && (
                    <Form.Item label="Color" className="mb-4">
                      <Select
                        value={selectedColor}
                        onChange={setSelectedColor}
                        placeholder="Select color"
                        style={{ width: "100%" }}
                      >
                        <Option value={item.color}>{item.color}</Option>
                      </Select>
                    </Form.Item>
                  )}
                </div>
              )}

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
                  maxCount={1}
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
                  disabled={
                    orderType === "goods" && item && item.stock < quantity
                  }
                >
                  {orderType === "product" ? "Buy Course" : "Buy Goods"}
                </Button>
              </Form.Item>
            </Form>
          </div>

          {/* Right Section: Item Details */}
          {item && (
            <div className="flex-1 lg:w-1/3 bg-white p-6 rounded-md shadow-md">
              <Title level={4} className="mb-4">
                Order Summary
              </Title>

              <div className="flex items-center gap-4 mb-4">
                <img
                  src={item.image || image}
                  alt={orderType === "product" ? "Course" : "Goods"}
                  className="w-24 h-24 rounded-md object-cover"
                />
                <div className="flex-1">{renderItemInfo()}</div>
              </div>

              {/* Quantity Selector */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <Text strong>จำนวน:</Text>
                  <InputNumber
                    min={1}
                    max={orderType === "goods" ? item.stock : 10}
                    value={quantity}
                    onChange={handleQuantityChange}
                    style={{ width: "120px" }}
                  />
                </div>
                <Text type="secondary" className="block mb-4 text-xs">
                  {orderType === "product"
                    ? "* การซื้อจำนวนมากกว่า 1 รายการ จะรวมระยะเวลาใช้งานเข้าด้วยกัน"
                    : `* สต็อกที่มีอยู่: ${item.stock} ${item.unit}`}
                </Text>
              </div>

              <Divider className="my-4" />

              {/* Order Details */}
              {renderOrderSummary()}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
