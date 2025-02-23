import { useEffect, useState } from "react";
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
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/Products.css";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../services/productService";

const { Sider, Content } = Layout;
const { Option } = Select;

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts();
      if (response.status === "success") {
        setProducts(response.data); // Update state with fetched products
      } else {
        message.error("Failed to load products");
      }
    } catch (error) {
      message.error("Failed to load products", error);
    }
    setLoading(false);
  };

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

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const productData = {
        ...values,
        image: values.image?.[0]?.originFileObj, // Use the uploaded file object
      };

      if (editingProduct) {
        await updateProduct(editingProduct._id, productData); // Use `_id` from API response
        message.success("Product updated successfully");
      } else {
        await createProduct(productData);
        message.success("Product created successfully");
      }

      fetchProducts(); // Refresh product list
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to save product", error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(editingProduct._id); // Use `_id` from API response
      message.success("Product deleted successfully");
      fetchProducts(); // Refresh product list
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to delete product", error);
    }
  };

  const columns = [
    { title: "SESSIONS", dataIndex: "sessions", key: "sessions" },
    { title: "PRICE", dataIndex: "price", key: "price" },
    // {
    //   title: "STATUS",
    //   dataIndex: "status",
    //   key: "status",
    //   render: (status) => (
    //     <Tag color={status === "Active" ? "green" : "gray"}>{status}</Tag>
    //   ),
    // },
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
            rowKey="_id"
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
                name="price"
                label="Price"
                rules={[{ required: true, message: "Please enter the price" }]}
              >
                <Input type="number" />
              </Form.Item>
              <Form.Item name="sessions" label="Sessions (for course)">
                <Input type="number" />
              </Form.Item>
            </Form>
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default ProductPage;
