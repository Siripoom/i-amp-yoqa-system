import { useState, useEffect } from "react";
import {
  Layout,
  Table,
  Button,
  Tag,
  Modal,
  Select,
  message,
  Input,
  Form,
  Row,
  Col,
  Upload,
  Divider,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import orderService from "../../services/orderService";
import { getUsers } from "../../services/userService";
import { getProducts } from "../../services/productService";
import "../../styles/Order.css";

const { Sider, Content } = Layout;
const { Option } = Select;

const OrderPage = () => {
  const [orders, setOrders] = useState([]); // เก็บข้อมูลคำสั่งซื้อ
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); // คำสั่งซื้อที่เลือก
  const [newStatus, setNewStatus] = useState(""); // สถานะใหม่ที่เลือก
  const [newInvoice, setNewInvoice] = useState(""); // สถานะใหม่ที่เลือก
  const [createOrderModalVisible, setCreateOrderModalVisible] = useState(false);
  const [createOrderForm] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [createOrderLoading, setCreateOrderLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchUsers();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders();

      if (Array.isArray(response)) {
        setOrders(response); // ✅ ใช้ response เฉพาะกรณีเป็น Array
      } else if (response.data && Array.isArray(response.data)) {
        setOrders(response.data); // ✅ ดึง `orders` จาก Response
        console.log(response.data); // ✅ แสดงข้อมูลใน Console
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

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response.status === "success") {
        setUsers(response.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      if (response.status === "success") {
        setProducts(response.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // ✅ แสดง Modal และตั้งค่าข้อมูล Order
  const showModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status); // ตั้งค่าค่าสถานะเดิม
    setNewInvoice(order.invoice_number); // ตั้งค่าหมายเลขใบแจ้งหนี้เดิม
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
      await orderService.updateOrderStatus(
        selectedOrder._id,
        newStatus,
        newInvoice
      );
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

  // Handle opening create order modal
  const showCreateOrderModal = () => {
    createOrderForm.resetFields();
    setCreateOrderModalVisible(true);
  };

  // Handle creating a new order
  const handleCreateOrder = async (values) => {
    setCreateOrderLoading(true);
    try {
      const formData = new FormData();
      formData.append("user_id", values.user_id);
      formData.append("product_id", values.product_id);
      formData.append("quantity", values.quantity || 1);

      if (values.image && values.image.file) {
        formData.append("image", values.image.file.originFileObj);
      }

      await orderService.createOrder(formData);
      message.success("Order created successfully");
      fetchOrders();
      setCreateOrderModalVisible(false);
    } catch (error) {
      console.error("Error creating order:", error);
      message.error("Failed to create order");
    } finally {
      setCreateOrderLoading(false);
    }
  };

  // ✅ คอลัมน์ของตาราง
  const columns = [
    // { title: "ORDER ID", dataIndex: "_id", key: "_id" },
    {
      title: "INVOICE NUMBER",
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (invoice_number) => invoice_number || "N/A",
    },
    {
      title: "USER",
      dataIndex: "user_id",
      key: "user_id",
      render: (user) => (user ? `${user.first_name} ` : "N/A"),
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
      title: "QUANTITY",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity) => quantity || 1,
    },
    {
      title: "TOTAL PRICE (THB)",
      key: "total_price",
      render: (record) => {
        // ใช้ total_price จาก order ถ้ามี หรือคำนวณจาก product.price × quantity
        const totalPrice =
          record.total_price ||
          (record.product_id &&
            (record.quantity || 1) * record.product_id.price);

        return totalPrice ? `${totalPrice} THB` : "N/A";
      },
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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateOrderModal}
              className="create-order-button"
            >
              Create Order
            </Button>
          </div>

          {/* ตารางแสดงคำสั่งซื้อ */}
          <Table
            columns={columns}
            dataSource={orders || []} // ✅ ป้องกันกรณี `orders` เป็น `undefined`
            pagination={{ position: ["bottomCenter"], pageSize: 10 }}
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
                <div className="mt-2">
                  <Input
                    value={newInvoice}
                    onChange={(e) => setNewInvoice(e.target.value)}
                    style={{ marginBottom: "10px" }}
                    placeholder="Enter new status"
                  />
                </div>
              </div>
            )}
          </Modal>

          {/* Modal สร้างคำสั่งซื้อใหม่ */}
          <Modal
            title="Create New Order"
            visible={createOrderModalVisible}
            onCancel={() => setCreateOrderModalVisible(false)}
            footer={null}
            width={700}
          >
            <Form
              form={createOrderForm}
              layout="vertical"
              onFinish={handleCreateOrder}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="user_id"
                    label="Select User"
                    rules={[
                      { required: true, message: "Please select a user" },
                    ]}
                  >
                    <Select placeholder="Select a user">
                      {users.map((user) => (
                        <Option key={user._id} value={user._id}>
                          {user.first_name} {user.last_name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="product_id"
                    label="Select Product"
                    rules={[
                      { required: true, message: "Please select a product" },
                    ]}
                  >
                    <Select placeholder="Select a product">
                      {products.map((product) => (
                        <Option key={product._id} value={product._id}>
                          {product.sessions} Sessions - {product.price} THB
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="quantity" label="Quantity" initialValue={1}>
                <Input type="number" min={1} />
              </Form.Item>

              <Form.Item
                name="image"
                label="Payment Slip (Optional)"
                valuePropName="file"
              >
                <Upload
                  listType="picture"
                  maxCount={1}
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />}>Upload Payment Slip</Button>
                </Upload>
              </Form.Item>

              <Divider />

              <div style={{ textAlign: "right" }}>
                <Button
                  style={{ marginRight: 8 }}
                  onClick={() => setCreateOrderModalVisible(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createOrderLoading}
                >
                  Create Order
                </Button>
              </div>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default OrderPage;
