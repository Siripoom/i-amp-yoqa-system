import { useState } from "react";
import {
  Layout,
  Table,
  Input,
  Button,
  Select,
  Modal,
  Form,
  message,
  Upload,
  Tag,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../styles/Products.css";

const { Sider, Content } = Layout;
const { Option } = Select;

const initialProductData = [
  {
    productId: 59217,
    productName: "Cody Fisher",
    category: "Home Decor",
    quantity: 8,
    price: 100,
    status: "Active",
  },
  {
    productId: 59213,
    productName: "Kristin Watson",
    category: "Electronics",
    quantity: 1,
    price: 150,
    status: "Invited",
  },
];

const ProductPage = () => {
  const [products, setProducts] = useState(initialProductData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  const showCreateModal = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (editingProduct) {
        setProducts((prev) =>
          prev.map((product) =>
            product.productId === editingProduct.productId
              ? { ...product, ...values }
              : product
          )
        );
        message.success("Product updated successfully");
      } else {
        const newProduct = { ...values, productId: Date.now() };
        setProducts((prev) => [...prev, newProduct]);
        message.success("Product created successfully");
      }
      setIsModalVisible(false);
    });
  };

  const handleDelete = () => {
    setProducts((prev) =>
      prev.filter((product) => product.productId !== editingProduct.productId)
    );
    message.success("Product deleted successfully");
    setIsModalVisible(false);
  };

  const columns = [
    { title: "PRODUCT ID", dataIndex: "productId", key: "productId" },
    { title: "PRODUCT NAME", dataIndex: "productName", key: "productName" },
    { title: "CATEGORY", dataIndex: "category", key: "category" },
    { title: "QUANTITY", dataIndex: "quantity", key: "quantity" },
    { title: "PRICE", dataIndex: "price", key: "price" },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "gray"}>{status}</Tag>
      ),
    },
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
        <Header title="Product" />

        <Content className="product-container">
          <div className="product-header">
            <h2>Products</h2>
            <Button
              type="primary"
              className="create-product-button"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
            >
              Create Product
            </Button>
          </div>

          <div className="product-filters">
            <Select
              defaultValue="Product ID"
              style={{ width: 150, marginRight: 10 }}
            >
              <Option value="Product ID">Product ID</Option>
              <Option value="Product Name">Product Name</Option>
            </Select>
            <Input
              placeholder="Search"
              prefix={<SearchOutlined />}
              style={{ width: 200, marginRight: 10 }}
            />
          </div>

          <Table
            columns={columns}
            dataSource={products}
            pagination={{ position: ["bottomCenter"], pageSize: 5 }}
            rowKey="productId"
          />

          <Modal
            title={editingProduct ? "Edit Product" : "Create Product"}
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={[
              editingProduct && (
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
                name="productName"
                label="Product Name"
                rules={[
                  { required: true, message: "Please enter the product name" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="category"
                label="Category"
                rules={[
                  { required: true, message: "Please select the category" },
                ]}
              >
                <Select>
                  <Option value="Home Decor">Home Decor</Option>
                  <Option value="Electronics">Electronics</Option>
                  <Option value="Fashion">Fashion</Option>
                  <Option value="Health">Health</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[
                  { required: true, message: "Please enter the quantity" },
                ]}
              >
                <Input type="number" />
              </Form.Item>
              <Form.Item
                name="price"
                label="Price"
                rules={[{ required: true, message: "Please enter the price" }]}
              >
                <Input type="number" />
              </Form.Item>
              <Form.Item
                name="status"
                label="Status"
                rules={[
                  { required: true, message: "Please select the status" },
                ]}
              >
                <Select>
                  <Option value="Active">Active</Option>
                  <Option value="Inactive">Inactive</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="description"
                label="Description"
                rules={[
                  { required: true, message: "Please enter a description" },
                ]}
              >
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item
                name="image"
                label="Upload Image"
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              >
                <Upload
                  name="logo"
                  listType="picture"
                  beforeUpload={() => false}
                >
                  <Button icon={<UploadOutlined />}>Click to Upload</Button>
                </Upload>
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ProductPage;
