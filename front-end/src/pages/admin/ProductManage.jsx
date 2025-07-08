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
  DatePicker,
  Switch,
  InputNumber,
  Image,
  Space,
  Tooltip,
  Popconfirm,
  Card,
  Row,
  Col,
  Divider,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  FireOutlined,
  PercentageOutlined,
  EyeOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/Products.css";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleHotSale,
  getProductsWithComputedFields,
} from "../../services/productService";
import dayjs from "dayjs";

const { Sider, Content } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    hotSale: undefined,
    onPromotion: undefined,
    sortBy: "price",
    sortOrder: "asc",
  });

  useEffect(() => {
    fetchProducts();
  }, [filterOptions]);

  useEffect(() => {
    filterProducts();
  }, [searchText, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProductsWithComputedFields(filterOptions);
      if (response.status === "success") {
        setProducts(response.data);
      } else {
        message.error("Failed to load products");
      }
    } catch (error) {
      message.error("Failed to load products");
      console.error(error);
    }
    setLoading(false);
  };

  const filterProducts = () => {
    if (!searchText) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(
      (product) =>
        product.sessions
          ?.toString()
          .toLowerCase()
          .includes(searchText.toLowerCase()) ||
        product.price
          ?.toString()
          .toLowerCase()
          .includes(searchText.toLowerCase()) ||
        product.duration
          ?.toString()
          .toLowerCase()
          .includes(searchText.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const showCreateModal = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    setEditingProduct(record);

    // Prepare form values
    const formValues = {
      ...record,
      hotSale: record.hotSale || false,
    };

    // Handle promotion dates
    if (
      record.promotion &&
      record.promotion.startDate &&
      record.promotion.endDate
    ) {
      formValues.promotionDateRange = [
        dayjs(record.promotion.startDate),
        dayjs(record.promotion.endDate),
      ];
      formValues.promotionPrice = record.promotion.price;
    }

    form.setFieldsValue(formValues);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Prepare promotion data
      let promotionData = null;
      if (values.promotionPrice && values.promotionDateRange) {
        promotionData = {
          price: values.promotionPrice,
          startDate: values.promotionDateRange[0].toISOString(),
          endDate: values.promotionDateRange[1].toISOString(),
        };
      }

      const productData = {
        sessions: values.sessions,
        price: values.price,
        duration: values.duration,
        hotSale: values.hotSale || false,
        promotion: promotionData,
        image: values.image,
      };

      if (editingProduct) {
        await updateProduct(editingProduct._id, productData);
        message.success("Product updated successfully");
      } else {
        await createProduct(productData);
        message.success("Product created successfully");
      }

      fetchProducts();
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to save product");
      console.error(error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(editingProduct._id);
      message.success("Product deleted successfully");
      fetchProducts();
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to delete product");
    }
  };

  const handleToggleHotSale = async (productId, currentStatus) => {
    try {
      await toggleHotSale(productId);
      message.success(
        `Product ${!currentStatus ? "added to" : "removed from"} hot sale`
      );
      fetchProducts();
    } catch (error) {
      message.error("Failed to update hot sale status");
    }
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    setFilterOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilterOptions({
      hotSale: undefined,
      onPromotion: undefined,
      sortBy: "price",
      sortOrder: "asc",
    });
    setSearchText("");
  };

  const formatPrice = (price) => {
    return `฿${price?.toLocaleString() || 0}`;
  };

  const columns = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      width: 80,
      render: (image) =>
        image ? (
          <Image
            src={image}
            alt="Product"
            width={50}
            height={50}
            style={{ objectFit: "cover", borderRadius: 4 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        ),
    },
    {
      title: "Sessions",
      dataIndex: "sessions",
      key: "sessions",
      sorter: (a, b) => a.sessions - b.sessions,
      render: (sessions) => <Tag color="blue">{sessions} Sessions</Tag>,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
      render: (price, record) => (
        <div>
          {record.isPromotionActive && record.promotion?.price ? (
            <div>
              <div className="text-red-500 font-bold">
                {formatPrice(record.promotion.price)}
              </div>
              <div className="text-gray-400 line-through text-sm">
                {formatPrice(price)}
              </div>
              <Tag color="red" size="small">
                -{record.discountPercentage}%
              </Tag>
            </div>
          ) : (
            <div className="font-semibold">{formatPrice(price)}</div>
          )}
        </div>
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
      sorter: (a, b) => a.duration - b.duration,
      render: (duration) => <Tag color="green">{duration} Days</Tag>,
    },
    {
      title: "Status",
      key: "status",
      render: (record) => (
        <Space direction="vertical" size="small">
          <div>
            {record.hotSale && (
              <Tag color="orange" icon={<FireOutlined />}>
                Hot Sale
              </Tag>
            )}
            {record.isPromotionActive && (
              <Tag color="red" icon={<PercentageOutlined />}>
                On Promotion
              </Tag>
            )}
            {!record.hotSale && !record.isPromotionActive && (
              <Tag color="default">Regular</Tag>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (record) => (
        <Space size="small">
          <Tooltip title="Edit Product">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
            />
          </Tooltip>

          <Popconfirm
            title={`${record.hotSale ? "Remove from" : "Add to"} Hot Sale?`}
            description={`Are you sure you want to ${
              record.hotSale
                ? "remove this product from"
                : "add this product to"
            } hot sale?`}
            onConfirm={() => handleToggleHotSale(record._id, record.hotSale)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip
              title={
                record.hotSale ? "Remove from Hot Sale" : "Add to Hot Sale"
              }
            >
              <Button
                size="small"
                icon={<FireOutlined />}
                type={record.hotSale ? "primary" : "default"}
                danger={record.hotSale}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="Promotion Management" />

        <Content className="product-container p-6">
          <div className="product-header mb-6">
            <Row justify="space-between" align="middle">
              <Col>
                <h2 className="text-2xl font-bold">
                  Promotions ({filteredProducts.length})
                </h2>
              </Col>
            </Row>
          </div>

          <Card className="mb-6">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={6}>
                <Input
                  placeholder="Search sessions, price, duration..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={handleSearch}
                  allowClear
                />
              </Col>

              {/* <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder="Hot Sale"
                  value={filterOptions.hotSale}
                  onChange={(value) => handleFilterChange("hotSale", value)}
                  allowClear
                  style={{ width: "100%" }}
                >
                  <Option value={true}>Hot Sale Only</Option>
                  <Option value={false}>Regular Only</Option>
                </Select>
              </Col> */}

              <Col xs={24} sm={12} md={4}>
                <Select
                  placeholder="Promotion"
                  value={filterOptions.onPromotion}
                  onChange={(value) => handleFilterChange("onPromotion", value)}
                  allowClear
                  style={{ width: "100%" }}
                >
                  <Option value={true}>On Promotion</Option>
                  <Option value={false}>Regular Price</Option>
                </Select>
              </Col>

              <Col xs={24} sm={12} md={4}>
                <Select
                  value={`${filterOptions.sortBy}-${filterOptions.sortOrder}`}
                  onChange={(value) => {
                    const [sortBy, sortOrder] = value.split("-");
                    handleFilterChange("sortBy", sortBy);
                    handleFilterChange("sortOrder", sortOrder);
                  }}
                  style={{ width: "100%" }}
                >
                  <Option value="price-asc">Price: Low to High</Option>
                  <Option value="price-desc">Price: High to Low</Option>
                  <Option value="sessions-asc">Sessions: Low to High</Option>
                  <Option value="sessions-desc">Sessions: High to Low</Option>
                  <Option value="duration-asc">Duration: Short to Long</Option>
                  <Option value="duration-desc">Duration: Long to Short</Option>
                </Select>
              </Col>

              <Col xs={24} sm={12} md={2}>
                <Button onClick={resetFilters} type="default">
                  Reset
                </Button>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Button
                  type="primary"
                  size=""
                  icon={<PlusOutlined />}
                  onClick={showCreateModal}
                >
                  Create Product
                </Button>
              </Col>
            </Row>
          </Card>

          <Table
            columns={columns}
            dataSource={filteredProducts}
            loading={loading}
            pagination={{
              position: ["bottomCenter"],
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            rowKey="_id"
            scroll={{ x: 800 }}
          />

          <Modal
            title={
              <div className="flex items-center gap-2">
                <TagsOutlined />
                {editingProduct ? "Edit Product" : "Create New Product"}
              </div>
            }
            open={isModalVisible}
            onCancel={handleCancel}
            width={800}
            footer={[
              editingProduct && (
                <Popconfirm
                  key="delete"
                  title="Delete Product"
                  description="Are you sure you want to delete this product? This action cannot be undone."
                  onConfirm={handleDelete}
                  okText="Yes"
                  cancelText="No"
                  okType="danger"
                >
                  <Button
                    type="danger"
                    icon={<DeleteOutlined />}
                    loading={loading}
                  >
                    Delete
                  </Button>
                </Popconfirm>
              ),
              <Button key="cancel" onClick={handleCancel}>
                Cancel
              </Button>,
              <Button
                key="save"
                type="primary"
                onClick={handleSave}
                loading={loading}
              >
                {editingProduct ? "Update" : "Create"}
              </Button>,
            ]}
          >
            <Form form={form} layout="vertical" className="mt-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="sessions"
                    label="Sessions"
                    rules={[
                      {
                        required: true,
                        message: "Please enter the number of sessions",
                      },
                      {
                        type: "number",
                        min: 1,
                        message: "Sessions must be at least 1",
                      },
                    ]}
                  >
                    <InputNumber
                      placeholder="Enter number of sessions"
                      style={{ width: "100%" }}
                      min={1}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="price"
                    label="Price (฿)"
                    rules={[
                      { required: true, message: "Please enter the price" },
                      {
                        type: "number",
                        min: 0,
                        message: "Price must be greater than 0",
                      },
                    ]}
                  >
                    <InputNumber
                      placeholder="Enter price"
                      style={{ width: "100%" }}
                      min={0}
                      formatter={(value) =>
                        `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/฿\s?|(,*)/g, "")}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="duration"
                    label="Duration (Days)"
                    rules={[
                      { required: true, message: "Please enter the duration" },
                      {
                        type: "number",
                        min: 1,
                        message: "Duration must be at least 1 day",
                      },
                    ]}
                  >
                    <InputNumber
                      placeholder="Enter duration in days"
                      style={{ width: "100%" }}
                      min={1}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="hotSale"
                    label="Hot Sale"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="Hot Sale"
                      unCheckedChildren="Regular"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">Promotion Settings</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="promotionPrice"
                    label="Promotion Price (฿)"
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (getFieldValue("promotionDateRange") && !value) {
                            return Promise.reject(
                              new Error(
                                "Please enter promotion price when date range is selected"
                              )
                            );
                          }
                          if (
                            value &&
                            getFieldValue("price") &&
                            value >= getFieldValue("price")
                          ) {
                            return Promise.reject(
                              new Error(
                                "Promotion price must be less than regular price"
                              )
                            );
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <InputNumber
                      placeholder="Enter promotion price"
                      style={{ width: "100%" }}
                      min={0}
                      formatter={(value) =>
                        `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/฿\s?|(,*)/g, "")}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="promotionDateRange"
                    label="Promotion Period"
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (getFieldValue("promotionPrice") && !value) {
                            return Promise.reject(
                              new Error(
                                "Please select promotion period when price is entered"
                              )
                            );
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <RangePicker
                      style={{ width: "100%" }}
                      placeholder={["Start Date", "End Date"]}
                      showTime
                      format="YYYY-MM-DD HH:mm"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="image" label="Product Image">
                <Upload
                  name="image"
                  listType="picture-card"
                  beforeUpload={() => false}
                  onChange={(info) => {
                    if (info.fileList && info.fileList.length > 0) {
                      form.setFieldsValue({ image: info.fileList });
                    } else {
                      form.setFieldsValue({ image: null });
                    }
                  }}
                  maxCount={1}
                  showUploadList={{
                    showPreviewIcon: true,
                    showRemoveIcon: true,
                  }}
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload Image</div>
                  </div>
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
