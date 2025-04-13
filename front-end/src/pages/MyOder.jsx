import { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Card,
  Typography,
  Image,
  Descriptions,
  Empty,
  Spin,
} from "antd";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import orderService from "../services/orderService";

const { Title, Text } = Typography;

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!userId) {
          throw new Error("User ID not found. Please log in again.");
        }

        setLoading(true);
        const response = await orderService.getOrdersByUserId(userId);
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.message || "Failed to fetch orders");
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case "อนุมัติ":
        return "success";
      case "รออนุมัติ":
        return "warning";
      case "ยกเลิก":
        return "error";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Order Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Product",
      dataIndex: "product_id",
      key: "product",
      render: (product) => (
        <div>
          <Text strong>{product?.sessions} Sessions</Text>
          <p>{product?.duration} days</p>
        </div>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity) => quantity || 1,
    },
    {
      title: "Total Sessions",
      key: "totalSessions",
      render: (record) => {
        // Calculate from order data if available, otherwise calculate from product
        const totalSessions =
          record.total_sessions ||
          record.product_id?.sessions * (record.quantity || 1);
        return totalSessions;
      },
    },
    {
      title: "Total Duration",
      key: "totalDuration",
      render: (record) => {
        // Calculate from order data if available, otherwise calculate from product
        const totalDuration =
          record.total_duration ||
          record.product_id?.duration * (record.quantity || 1);
        return `${totalDuration} days`;
      },
    },
    {
      title: "Price",
      dataIndex: "total_price",
      key: "price",
      render: (price, record) => {
        // Use total_price if available, otherwise calculate from product
        const totalPrice =
          price || record.product_id?.price * (record.quantity || 1);
        return `${totalPrice} THB`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex justify-center items-center">
          <Spin size="large" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex justify-center items-center">
          <Card className="w-full max-w-md">
            <Title level={4} className="text-red-500">
              Error
            </Title>
            <Text>{error}</Text>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="py-8 flex-grow">
        <div className="container mx-auto px-4">
          <Title level={2} className="mb-6">
            My Orders
          </Title>

          {orders.length > 0 ? (
            <Table
              dataSource={orders}
              columns={columns}
              rowKey="_id"
              expandable={{
                expandedRowRender: (record) => (
                  <div className="p-4">
                    <Descriptions title="Order Details" bordered column={1}>
                      <Descriptions.Item label="Order ID">
                        {record._id}
                      </Descriptions.Item>
                      <Descriptions.Item label="Invoice Number">
                        {record.invoice_number || "Not available yet"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Approval Date">
                        {record.approval_date
                          ? new Date(record.approval_date).toLocaleString()
                          : "Not approved yet"}
                      </Descriptions.Item>
                      <Descriptions.Item label="First Used Date">
                        {record.first_used_date
                          ? new Date(record.first_used_date).toLocaleString()
                          : "Not used yet"}
                      </Descriptions.Item>

                      {/* Additional quantity information */}
                      <Descriptions.Item label="Quantity">
                        {record.quantity || 1}
                      </Descriptions.Item>
                      <Descriptions.Item label="Unit Price">
                        {record.unit_price
                          ? `${record.unit_price} THB`
                          : record.product_id
                          ? `${record.product_id.price} THB`
                          : "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Price">
                        {record.total_price
                          ? `${record.total_price} THB`
                          : record.product_id
                          ? `${
                              record.product_id.price * (record.quantity || 1)
                            } THB`
                          : "N/A"}
                      </Descriptions.Item>

                      <Descriptions.Item label="Usage Notes">
                        <Text type="secondary">
                          This promotion provides a total of{" "}
                          {record.total_sessions ||
                            record.product_id?.sessions *
                              (record.quantity || 1)}
                          sessions valid for{" "}
                          {record.total_duration ||
                            record.product_id?.duration *
                              (record.quantity || 1)}{" "}
                          days from your first use.
                        </Text>
                      </Descriptions.Item>
                    </Descriptions>

                    {record.image && (
                      <div className="mt-4">
                        <Title level={5}>Payment Receipt</Title>
                        <Image
                          src={record.image}
                          alt="Payment receipt"
                          style={{ maxWidth: "300px" }}
                        />
                      </div>
                    )}
                  </div>
                ),
              }}
            />
          ) : (
            <Empty description="No orders found" />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MyOrders;
