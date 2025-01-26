import { useState } from "react";
import {
  Layout,
  Table,
  Input,
  Button,
  Tag,
  Select,
  Modal,
  Form,
  message,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/Order.css";

const { Sider, Content } = Layout;
const { Option } = Select;

const initialOrderData = [
  {
    orderId: 59217,
    orderNumber: "59217342",
    status: "New Order",
    item: 1,
    customerName: "Cody Fisher",
    shippingService: "Standard",
    trackingCode: "940010010936113003113",
  },
  {
    orderId: 59213,
    orderNumber: "59217343",
    status: "Shipped",
    item: 2,
    customerName: "Kristin Watson",
    shippingService: "Priority",
    trackingCode: "940010010936113003113",
  },
];

const OrderPage = () => {
  const [orders, setOrders] = useState(initialOrderData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [form] = Form.useForm();

  const showCreateModal = () => {
    setEditingOrder(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    setEditingOrder(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (editingOrder) {
        setOrders((prev) =>
          prev.map((order) =>
            order.orderId === editingOrder.orderId
              ? { ...order, ...values }
              : order
          )
        );
        message.success("Order updated successfully");
      } else {
        const newOrder = { ...values, orderId: Date.now() };
        setOrders((prev) => [...prev, newOrder]);
        message.success("Order created successfully");
      }
      setIsModalVisible(false);
    });
  };

  const handleDelete = () => {
    setOrders((prev) =>
      prev.filter((order) => order.orderId !== editingOrder.orderId)
    );
    message.success("Order deleted successfully");
    setIsModalVisible(false);
  };

  const columns = [
    { title: "ORDER ID", dataIndex: "orderId", key: "orderId" },
    { title: "ORDER NUMBER", dataIndex: "orderNumber", key: "orderNumber" },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusColors = {
          "New Order": "blue",
          Shipped: "green",
          Cancelled: "red",
          "In Production": "orange",
          Draft: "gray",
        };
        return <Tag color={statusColors[status]}>{status}</Tag>;
      },
    },
    { title: "ITEM", dataIndex: "item", key: "item" },
    { title: "CUSTOMER NAME", dataIndex: "customerName", key: "customerName" },
    {
      title: "SHIPPING SERVICE",
      dataIndex: "shippingService",
      key: "shippingService",
    },
    { title: "TRACKING CODE", dataIndex: "trackingCode", key: "trackingCode" },
    {
      title: "ACTION",
      key: "action",
      render: (record) => (
        <Button
          icon={<EditOutlined />}
          shape="circle"
          onClick={() => showEditModal(record)}
        />
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="Order" />

        <Content className="order-container">
          <div className="order-header">
            <h2>Orders</h2>
            <Button
              type="primary"
              className="create-order-button"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
            >
              Create Order
            </Button>
          </div>

          <div className="order-filters">
            <Select
              defaultValue="Order ID"
              style={{ width: 150, marginRight: 10 }}
            >
              <Option value="Order ID">Order ID</Option>
              <Option value="Customer Name">Customer Name</Option>
            </Select>
            <Input
              placeholder="Search"
              prefix={<SearchOutlined />}
              style={{ width: 200, marginRight: 10 }}
            />
          </div>

          <Table
            columns={columns}
            dataSource={orders}
            pagination={{ position: ["bottomCenter"], pageSize: 5 }}
            rowKey="orderId"
          />

          <Modal
            title={editingOrder ? "Edit Order" : "Create Order"}
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={[
              editingOrder && (
                <Button
                  key="delete"
                  type="danger"
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              ),
              <Button key="cancel" onClick={handleCancel}>
                Cancel
              </Button>,
              <Button key="save" type="primary" onClick={handleSave}>
                Save
              </Button>,
            ]}
          >
            <Form form={form} layout="vertical">
              <Form.Item
                name="orderNumber"
                label="Order Number"
                rules={[
                  { required: true, message: "Please enter the order number" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="status"
                label="Status"
                rules={[
                  { required: true, message: "Please select the status" },
                ]}
              >
                <Select>
                  <Option value="New Order">New Order</Option>
                  <Option value="In Production">In Production</Option>
                  <Option value="Shipped">Shipped</Option>
                  <Option value="Cancelled">Cancelled</Option>
                  <Option value="Draft">Draft</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="item"
                label="Item"
                rules={[
                  { required: true, message: "Please enter the item count" },
                ]}
              >
                <Input type="number" />
              </Form.Item>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[
                  { required: true, message: "Please enter the customer name" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="shippingService"
                label="Shipping Service"
                rules={[
                  {
                    required: true,
                    message: "Please enter the shipping service",
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="trackingCode"
                label="Tracking Code"
                rules={[
                  { required: true, message: "Please enter the tracking code" },
                ]}
              >
                <Input />
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default OrderPage;
