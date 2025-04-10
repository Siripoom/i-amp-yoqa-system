import { useState, useEffect } from "react";
import { Layout, Table, Button, Tag, Modal, Select, message } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import orderService from "../../services/orderService";
import "../../styles/Order.css";

const { Sider, Content } = Layout;
const { Option } = Select;

const OrderPage = () => {
  const [orders, setOrders] = useState([]); // เก็บข้อมูลคำสั่งซื้อ
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); // คำสั่งซื้อที่เลือก
  const [newStatus, setNewStatus] = useState(""); // สถานะใหม่ที่เลือก

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders();

    

      if (Array.isArray(response)) {
        setOrders(response); // ✅ ใช้ response เฉพาะกรณีเป็น Array
      } else if (response.data && Array.isArray(response.data)) {
        setOrders(response.data); // ✅ ดึง `orders` จาก Response
      } else {
        setOrders([]); // ✅ ป้องกัน `undefined`
      }
    } catch (error) {
      message.error("Failed to load orders.");
      setOrders([]); // ✅ ป้องกันข้อผิดพลาด
    } finally {
      setLoading(false);
    }
  };

  // ✅ แสดง Modal และตั้งค่าข้อมูล Order
  const showModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status); // ตั้งค่าค่าสถานะเดิม
    setIsModalVisible(true);
  };

  // ✅ ปิด Modal
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // ✅ อัปเดตสถานะ Order
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    try {
      await orderService.updateOrderStatus(selectedOrder._id, newStatus);
      message.success("Order status updated successfully.");
      fetchOrders(); // โหลดข้อมูลใหม่
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to update order status.");
    }
  };

  // ✅ ลบคำสั่งซื้อ
  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;

    try {
      await orderService.deleteOrder(selectedOrder._id);
      message.success("Order deleted successfully.");
      fetchOrders(); // โหลดข้อมูลใหม่
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to delete order.");
    }
  };

  // ✅ แสดงสีของสถานะ Order
  const renderStatusTag = (status) => {
    const correctedStatus = status === "รออนุมติ" ? "รออนุมัติ" : status;
    const statusColors = {
      รออนุมัติ: "blue",
      อนุมัติ: "green",
    };
    return (
      <Tag color={statusColors[correctedStatus] || "gray"}>
        {correctedStatus}
      </Tag>
    );
  };

  // ✅ คอลัมน์ของตาราง
  const columns = [
    { title: "ORDER ID", dataIndex: "_id", key: "_id" },
    {
      title: "USER",
      dataIndex: "user_id",
      key: "user_id",
      render: (user) => (user ? `${user.first_name} ${user.last_name}` : "N/A"),
    },
    {
      title: "PRODUCT",
      dataIndex: "product_id",
      key: "product_id",
      render: (product) => (product ? `Session: ${product.sessions}` : "N/A"),
    },
    {
      title: "PRICE (THB)",
      dataIndex: "product_id",
      key: "price",
      render: (product) => (product ? `${product.price} THB` : "N/A"),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status) => renderStatusTag(status),
    },
    {
      title: "ORDER DATE",
      dataIndex: "order_date",
      key: "order_date",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "ACTION",
      key: "action",
      render: (record) => (
        <>
          <Button
            icon={<EditOutlined />}
            shape="circle"
            onClick={() => showModal(record)}
          />
        </>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="Order Management" />

        <Content className="order-container">
          <div className="order-header">
            <h2>Orders</h2>
          </div>

          {/* ตารางแสดงคำสั่งซื้อ */}
          <Table
            columns={columns}
            dataSource={orders || []} // ✅ ป้องกันกรณี `orders` เป็น `undefined`
            pagination={{ position: ["bottomCenter"], pageSize: 5 }}
            rowKey="_id"
            loading={loading}
          />

          {/* Modal แก้ไข / ลบคำสั่งซื้อ */}
          <Modal
            title="Manage Order"
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={[
              <Button
                key="delete"
                type="danger"
                icon={<DeleteOutlined />}
                onClick={handleDeleteOrder}
              >
                Delete Order
              </Button>,
              <Button key="cancel" onClick={handleCancel}>
                Cancel
              </Button>,
              <Button key="update" type="primary" onClick={handleUpdateStatus}>
                Update Status
              </Button>,
            ]}
          >
            {selectedOrder && (
              <div>
                <p>
                  <strong>Order ID:</strong> {selectedOrder._id}
                </p>
                <p>
                  <strong>Current Status:</strong>{" "}
                  {renderStatusTag(selectedOrder.status)}
                </p>

                {/* ✅ แสดงภาพหลักฐานการชำระเงิน */}
                {selectedOrder.image ? (
                  <div style={{ textAlign: "center", marginBottom: "10px" }}>
                    <p>
                      <strong>Payment Slip:</strong>
                    </p>
                    <img
                      src={selectedOrder.image} // ✅ ดึงภาพจาก API
                      alt="Payment Slip"
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                ) : (
                  <p style={{ color: "gray", textAlign: "center" }}>
                    No payment slip uploaded
                  </p>
                )}

                <Select
                  value={newStatus}
                  onChange={setNewStatus}
                  style={{ width: "100%" }}
                >
                  <Option value="รออนุมัติ">รออนุมัติ</Option>
                  <Option value="อนุมัติ">อนุมัติ</Option>
                </Select>
              </div>
            )}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default OrderPage;
