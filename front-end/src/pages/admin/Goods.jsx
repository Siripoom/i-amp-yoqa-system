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
  Typography,
  Badge,
  Empty,
  Spin,
  Carousel,
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
  StockOutlined,
  DollarOutlined,
  FilterOutlined,
  ClearOutlined,
  BarcodeOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import goodsService from "../../services/goods-service";
import "../../styles/Goods.css";
import dayjs from "dayjs";

const { Sider, Content } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Title, Text } = Typography;

const GoodsPage = () => {
  // State management
  const [goods, setGoods] = useState([]);
  const [filteredGoods, setFilteredGoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editingGoods, setEditingGoods] = useState(null);
  const [viewingGoods, setViewingGoods] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUnit, setFilterUnit] = useState("all");
  const [priceRange, setPriceRange] = useState([null, null]);
  const [form] = Form.useForm();
  const [stockForm] = Form.useForm();
  const [isStockModalVisible, setIsStockModalVisible] = useState(false);
  const [stockGoods, setStockGoods] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Fetch goods data
  const fetchGoods = async (page = 1, limit = 10, filters = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...filters,
      };

      const response = await goodsService.getAllGoods(params);
      setGoods(response.data || []);
      setFilteredGoods(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      message.error("Failed to fetch goods");
      console.error("Error fetching goods:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search function
  const handleSearch = (value) => {
    setSearchText(value);
    if (value.trim()) {
      searchGoods(value);
    } else {
      setFilteredGoods(goods);
    }
  };

  const searchGoods = async (query) => {
    try {
      setLoading(true);
      const response = await goodsService.searchGoods(query);
      setFilteredGoods(response.data || []);
    } catch (error) {
      message.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const applyFilters = () => {
    let filtered = [...goods];

    // Filter by status
    if (filterStatus !== "all") {
      if (filterStatus === "inStock") {
        filtered = filtered.filter((item) => item.stock > 0);
      } else if (filterStatus === "outOfStock") {
        filtered = filtered.filter((item) => item.stock <= 0);
      } else if (filterStatus === "promotional") {
        filtered = filtered.filter(
          (item) =>
            item.promotion && item.promotion.startDate && item.promotion.endDate
        );
      } else if (filterStatus === "hotSale") {
        filtered = filtered.filter((item) => item.hotSale);
      }
    }

    // Filter by unit
    if (filterUnit !== "all") {
      filtered = filtered.filter((item) => item.unit === filterUnit);
    }

    // Filter by price range
    if (priceRange[0] !== null && priceRange[1] !== null) {
      filtered = filtered.filter(
        (item) => item.price >= priceRange[0] && item.price <= priceRange[1]
      );
    }

    setFilteredGoods(filtered);
  };

  const clearFilters = () => {
    setFilterStatus("all");
    setFilterUnit("all");
    setPriceRange([null, null]);
    setSearchText("");
    setFilteredGoods(goods);
  };

  // Generate unique code
  const generateCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `GD${timestamp}${random}`;
  };

  // Modal handlers
  const showCreateModal = () => {
    setEditingGoods(null);
    form.resetFields();
    form.setFieldsValue({
      code: "",
      unit: "ชิ้น",
      hotSale: false,
    });
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    setEditingGoods(record);

    // Handle multiple images for editing
    const imageFileList =
      record.image && Array.isArray(record.image)
        ? record.image.map((url, index) => ({
            uid: `image-${index}`,
            name: `image-${index}`,
            status: "done",
            url: url,
          }))
        : [];

    form.setFieldsValue({
      ...record,
      images: imageFileList,
      promotionPrice: record.promotion?.price || null,
      promotionStartDate: record.promotion?.startDate
        ? dayjs(record.promotion.startDate)
        : null,
      promotionEndDate: record.promotion?.endDate
        ? dayjs(record.promotion.endDate)
        : null,
      hasPromotion: !!(record.promotion?.price || record.promotion?.startDate),
    });
    setIsModalVisible(true);
  };

  const showViewModal = (record) => {
    setViewingGoods(record);
    setIsViewModalVisible(true);
  };

  const showStockModal = (record) => {
    setStockGoods(record);
    stockForm.setFieldsValue({ stock: record.stock });
    setIsStockModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsViewModalVisible(false);
    setIsStockModalVisible(false);
    setEditingGoods(null);
    setViewingGoods(null);
    setStockGoods(null);
    form.resetFields();
    stockForm.resetFields();
  };

  // CRUD operations
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      console.log("Form values:", values); // Debug log

      // Create FormData for file upload
      const formData = new FormData();

      // Append basic fields with proper type checking
      formData.append("goods", values.goods || "");
      formData.append("code", values.code || "");
      formData.append("detail", values.detail || "");
      formData.append(
        "stock",
        values.stock !== undefined ? Number(values.stock) : 0
      );
      formData.append("unit", values.unit || "ชิ้น");
      formData.append("size", values.size || "");
      formData.append("color", values.color || "");
      formData.append(
        "price",
        values.price !== undefined ? Number(values.price) : 0
      );
      formData.append("hotSale", values.hotSale || false);

      // Handle multiple images
      if (values.images && values.images.length > 0) {
        values.images.forEach((file) => {
          if (file.originFileObj) {
            formData.append("images", file.originFileObj);
          }
        });
      }

      // Handle promotion data
      if (values.hasPromotion) {
        const promotionData = {
          price: values.promotionPrice,
          startDate: values.promotionStartDate?.toISOString(),
          endDate: values.promotionEndDate?.toISOString(),
        };
        formData.append("promotion", JSON.stringify(promotionData));
      } else {
        formData.append("promotion", "null");
      }

      // Debug: Log FormData contents
      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      if (editingGoods) {
        await goodsService.updateGoods(editingGoods._id, formData);
        message.success("Goods updated successfully");
      } else {
        await goodsService.createGoods(formData);
        message.success("Goods created successfully");
      }

      fetchGoods(currentPage, pageSize);
      setIsModalVisible(false);
    } catch (error) {
      message.error("Failed to save goods");
      console.error("Error saving goods:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await goodsService.deleteGoods(id);
      message.success("Goods deleted successfully");
      fetchGoods(currentPage, pageSize);
    } catch (error) {
      message.error("Failed to delete goods");
      console.error("Error deleting goods:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async () => {
    try {
      const values = await stockForm.validateFields();
      setLoading(true);
      await goodsService.updateStock(stockGoods._id, values.stock);
      message.success("Stock updated successfully");
      fetchGoods(currentPage, pageSize);
      setIsStockModalVisible(false);
    } catch (error) {
      message.error("Failed to update stock");
      console.error("Error updating stock:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if promotion is active
  const isPromotionActive = (promotion) => {
    if (!promotion || !promotion.startDate || !promotion.endDate) return false;
    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);
    return now >= start && now <= end;
  };

  // Calculate promotional price
  const getDisplayPrice = (goods) => {
    if (
      goods.promotion &&
      goods.promotion.price &&
      isPromotionActive(goods.promotion)
    ) {
      return goods.promotion.price;
    }
    return goods.price;
  };

  // Render multiple images
  const renderMultipleImages = (images) => {
    if (!images || images.length === 0) {
      return (
        <Image
          width={50}
          height={50}
          src="/placeholder-image.jpg"
          fallback="/placeholder-image.jpg"
          style={{ borderRadius: "8px", objectFit: "cover" }}
        />
      );
    }

    if (images.length === 1) {
      return (
        <Image
          width={50}
          height={50}
          src={images[0] || "/placeholder-image.jpg"}
          fallback="/placeholder-image.jpg"
          style={{ borderRadius: "8px", objectFit: "cover" }}
        />
      );
    }

    return (
      <div style={{ position: "relative", width: 50, height: 50 }}>
        <Image
          width={50}
          height={50}
          src={images[0] || "/placeholder-image.jpg"}
          fallback="/placeholder-image.jpg"
          style={{ borderRadius: "8px", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            borderRadius: "50%",
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            fontWeight: "bold",
          }}
        >
          +{images.length - 1}
        </div>
      </div>
    );
  };

  // Table columns
  const columns = [
    {
      title: "IMAGE",
      dataIndex: "image",
      key: "image",
      width: 100,
      render: (image) => renderMultipleImages(image),
    },
    {
      title: "CODE",
      dataIndex: "code",
      key: "code",
      width: 140,
      render: (code) => (
        <Text code style={{ fontSize: "12px" }}>
          {code}
        </Text>
      ),
    },
    {
      title: "GOODS NAME",
      dataIndex: "goods",
      key: "goods",
      width: 200,
      ellipsis: true,
      render: (goods) => (
        <Text strong style={{ fontSize: "14px" }}>
          {goods}
        </Text>
      ),
    },
    {
      title: "SIZE/COLOR",
      key: "sizeColor",
      width: 140,
      render: (record) => (
        <Space direction="vertical" size="small">
          {record.size && (
            <Tag color="geekblue" style={{ margin: 0 }}>
              {record.size}
            </Tag>
          )}
          {record.color && (
            <Tag color="orange" style={{ margin: 0 }}>
              {record.color}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "PRICE",
      dataIndex: "price",
      key: "price",
      width: 130,
      render: (price, record) => {
        const displayPrice = getDisplayPrice(record);
        const isOnPromotion = displayPrice !== price;

        return (
          <Space direction="vertical" size="small">
            <Text
              strong
              style={{
                color: isOnPromotion ? "#ff4d4f" : "#fa7e1e",
                fontSize: "14px",
              }}
            >
              {displayPrice?.toLocaleString()} THB
            </Text>
            {isOnPromotion && (
              <Text
                delete
                style={{
                  color: "#999",
                  fontSize: "12px",
                }}
              >
                {price?.toLocaleString()} THB
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "STOCK",
      dataIndex: "stock",
      key: "stock",
      width: 120,
      render: (stock, record) => (
        <Space direction="vertical" size="small">
          <Badge
            count={stock}
            style={{
              backgroundColor: stock > 0 ? "#52c41a" : "#ff4d4f",
            }}
            showZero
          />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.unit}
          </Text>
        </Space>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      fixed: "right",
      width: 160,
      render: (record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showViewModal(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this item?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Upload props for multiple images
  const uploadProps = {
    beforeUpload: (file) => {
      const isJpgOrPng =
        file.type === "image/jpeg" || file.type === "image/png";
      if (!isJpgOrPng) {
        message.error("You can only upload JPG/PNG file!");
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error("Image must smaller than 2MB!");
      }
      return isJpgOrPng && isLt2M ? false : Upload.LIST_IGNORE;
    },
    onChange: ({ fileList }) => {
      // Limit to 3 images
      if (fileList.length > 3) {
        message.warning("You can only upload maximum 3 images!");
        return;
      }
      form.setFieldsValue({ images: fileList });
    },
  };

  // Effects
  useEffect(() => {
    fetchGoods(currentPage, pageSize);
  }, [currentPage, pageSize]);

  useEffect(() => {
    applyFilters();
  }, [filterStatus, filterUnit, priceRange, goods]);

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="Goods Management" />

        <Content className="goods-container p-6">
          {/* Header Section */}
          <div className="goods-header mb-6">
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={2} style={{ margin: 0 }}>
                  Goods Management
                </Title>
                <Text type="secondary">
                  Manage your product inventory and pricing
                </Text>
              </Col>
              <Col></Col>
            </Row>
          </div>

          {/* Filters Section */}
          <Card className="mb-4">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={6}>
                <Input
                  placeholder="Search goods..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={showCreateModal}
                  className="create-goods-button"
                >
                  Add New Goods
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Statistics Cards */}
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={12} sm={6}>
              <Card>
                <div style={{ textAlign: "center" }}>
                  <Text type="secondary">Total Goods</Text>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#1890ff",
                    }}
                  >
                    {total}
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <div style={{ textAlign: "center" }}>
                  <Text type="secondary">In Stock</Text>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#52c41a",
                    }}
                  >
                    {filteredGoods.filter((item) => item.stock > 0).length}
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <div style={{ textAlign: "center" }}>
                  <Text type="secondary">Promotional</Text>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#fa7e1e",
                    }}
                  >
                    {
                      filteredGoods.filter(
                        (item) =>
                          item.promotion && isPromotionActive(item.promotion)
                      ).length
                    }
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card>
                <div style={{ textAlign: "center" }}>
                  <Text type="secondary">Hot Sale</Text>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#ff4d4f",
                    }}
                  >
                    {filteredGoods.filter((item) => item.hotSale).length}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={filteredGoods}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
              }}
              rowKey="_id"
              loading={loading}
              locale={{
                emptyText: (
                  <Empty
                    description="No goods found"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              }}
            />
          </Card>

          {/* Create/Edit Modal */}
          <Modal
            title={editingGoods ? "Edit Goods" : "Create New Goods"}
            visible={isModalVisible}
            onCancel={handleCancel}
            footer={[
              <Button key="cancel" onClick={handleCancel}>
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                onClick={handleSave}
                loading={loading}
              >
                {editingGoods ? "Update" : "Create"}
              </Button>,
            ]}
            width={800}
          >
            <Form form={form} layout="vertical" requiredMark="optional">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="goods"
                    label="Goods Name"
                    rules={[
                      { required: true, message: "Please enter goods name" },
                    ]}
                  >
                    <Input placeholder="Enter goods name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="code"
                    label="Goods Code"
                    rules={[
                      { required: true, message: "Please enter goods code" },
                    ]}
                  >
                    <Input
                      placeholder="Enter goods code"
                      prefix={<BarcodeOutlined />}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="detail" label="Details">
                <TextArea placeholder="Enter goods details" rows={3} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="price"
                    label="Price (THB)"
                    rules={[{ required: true, message: "Please enter price" }]}
                  >
                    <InputNumber
                      placeholder="0.00"
                      style={{ width: "100%" }}
                      min={0}
                      formatter={(value) =>
                        `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/฿\s?|(,*)/g, "")}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="stock"
                    label="Stock Quantity"
                    rules={[
                      {
                        required: true,
                        message: "Please enter stock quantity",
                      },
                    ]}
                  >
                    <InputNumber
                      placeholder="0"
                      style={{ width: "100%" }}
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="unit"
                    label="Unit"
                    rules={[{ required: true, message: "Please select unit" }]}
                  >
                    <Input placeholder="Enter unit (e.g., ชิ้น)" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="size" label="Size">
                    <Input placeholder="Enter size (optional)" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="color" label="Color">
                    <Input placeholder="Enter color (optional)" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="images" label="Product Images (Max 3)">
                <Upload
                  {...uploadProps}
                  listType="picture-card"
                  maxCount={3}
                  multiple
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  You can upload maximum 3 images. Each image must be less than
                  2MB.
                </Text>
              </Form.Item>

              <Divider />

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="hotSale"
                    label="Hot Sale"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="hasPromotion"
                    label="Has Promotion"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.hasPromotion !== currentValues.hasPromotion
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue("hasPromotion") ? (
                    <>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            name="promotionPrice"
                            label="Promotion Price (THB)"
                            rules={[
                              {
                                required: true,
                                message: "Please enter promotion price",
                              },
                            ]}
                          >
                            <InputNumber
                              placeholder="0.00"
                              style={{ width: "100%" }}
                              min={0}
                              formatter={(value) =>
                                `฿ ${value}`.replace(
                                  /\B(?=(\d{3})+(?!\d))/g,
                                  ","
                                )
                              }
                              parser={(value) =>
                                value.replace(/฿\s?|(,*)/g, "")
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="promotionStartDate"
                            label="Start Date"
                            rules={[
                              {
                                required: true,
                                message: "Please select start date",
                              },
                            ]}
                          >
                            <DatePicker style={{ width: "100%" }} showTime />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="promotionEndDate"
                            label="End Date"
                            rules={[
                              {
                                required: true,
                                message: "Please select end date",
                              },
                            ]}
                          >
                            <DatePicker style={{ width: "100%" }} showTime />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  ) : null
                }
              </Form.Item>
            </Form>
          </Modal>

          {/* View Modal */}
          <Modal
            title="Goods Details"
            visible={isViewModalVisible}
            onCancel={handleCancel}
            footer={[
              <Button key="close" onClick={handleCancel}>
                Close
              </Button>,
            ]}
            width={800}
          >
            {viewingGoods && (
              <div>
                <Row gutter={16}>
                  <Col span={12}>
                    {/* Multiple Images Display */}
                    {viewingGoods.image &&
                    Array.isArray(viewingGoods.image) &&
                    viewingGoods.image.length > 0 ? (
                      <div style={{ width: "100%" }}>
                        <Carousel
                          arrows={viewingGoods.image.length > 1}
                          prevArrow={<LeftOutlined />}
                          nextArrow={<RightOutlined />}
                          dots={viewingGoods.image.length > 1}
                        >
                          {viewingGoods.image.map((img, index) => (
                            <div key={index}>
                              <Image
                                width="100%"
                                height={200}
                                src={img || "/placeholder-image.jpg"}
                                fallback="/placeholder-image.jpg"
                                style={{
                                  borderRadius: "8px",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          ))}
                        </Carousel>
                        <div style={{ marginTop: 8, textAlign: "center" }}>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            {viewingGoods.image.length} image(s)
                          </Text>
                        </div>
                      </div>
                    ) : (
                      <Image
                        width="100%"
                        height={200}
                        src="/placeholder-image.jpg"
                        fallback="/placeholder-image.jpg"
                        style={{ borderRadius: "8px", objectFit: "cover" }}
                      />
                    )}
                  </Col>
                  <Col span={12}>
                    <Space
                      direction="vertical"
                      size="middle"
                      style={{ width: "100%" }}
                    >
                      <div>
                        <Text strong style={{ fontSize: "20px" }}>
                          {viewingGoods.goods}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Text code style={{ fontSize: "12px" }}>
                            {viewingGoods.code}
                          </Text>
                        </div>
                      </div>

                      <div>
                        {viewingGoods.size && (
                          <Tag color="geekblue" style={{ marginRight: 8 }}>
                            Size: {viewingGoods.size}
                          </Tag>
                        )}
                        {viewingGoods.color && (
                          <Tag color="orange" style={{ marginRight: 8 }}>
                            Color: {viewingGoods.color}
                          </Tag>
                        )}
                        {viewingGoods.hotSale && (
                          <Tag color="red" icon={<FireOutlined />}>
                            Hot Sale
                          </Tag>
                        )}
                        {viewingGoods.promotion &&
                          isPromotionActive(viewingGoods.promotion) && (
                            <Tag color="orange" icon={<PercentageOutlined />}>
                              Promotion Active
                            </Tag>
                          )}
                      </div>

                      <div>
                        <Text>Regular Price: </Text>
                        <Text
                          strong
                          style={{
                            color:
                              getDisplayPrice(viewingGoods) !==
                              viewingGoods.price
                                ? "#999"
                                : "#fa7e1e",
                            fontSize: "16px",
                            textDecoration:
                              getDisplayPrice(viewingGoods) !==
                              viewingGoods.price
                                ? "line-through"
                                : "none",
                          }}
                        >
                          {viewingGoods.price?.toLocaleString()} THB
                        </Text>
                      </div>

                      {getDisplayPrice(viewingGoods) !== viewingGoods.price && (
                        <div>
                          <Text>Promotion Price: </Text>
                          <Text
                            strong
                            style={{ color: "#ff4d4f", fontSize: "18px" }}
                          >
                            {getDisplayPrice(viewingGoods)?.toLocaleString()}{" "}
                            THB
                          </Text>
                        </div>
                      )}

                      <div>
                        <Text>Stock: </Text>
                        <Badge
                          count={viewingGoods.stock}
                          style={{
                            backgroundColor:
                              viewingGoods.stock > 0 ? "#52c41a" : "#ff4d4f",
                          }}
                          showZero
                        />
                        <Text style={{ marginLeft: 8 }} type="secondary">
                          {viewingGoods.unit}
                        </Text>
                      </div>
                    </Space>
                  </Col>
                </Row>

                {viewingGoods.detail && (
                  <>
                    <Divider />
                    <div>
                      <Text strong>Details:</Text>
                      <div style={{ marginTop: 8 }}>
                        <Text>{viewingGoods.detail}</Text>
                      </div>
                    </div>
                  </>
                )}

                {viewingGoods.promotion && (
                  <>
                    <Divider />
                    <div>
                      <Text strong>Promotion Information:</Text>
                      <div style={{ marginTop: 8 }}>
                        <Space direction="vertical" size="small">
                          <div>
                            <Text>Promotion Price: </Text>
                            <Text strong style={{ color: "#ff4d4f" }}>
                              {viewingGoods.promotion.price?.toLocaleString()}{" "}
                              THB
                            </Text>
                          </div>
                          {viewingGoods.promotion.startDate && (
                            <div>
                              <Text>Start Date: </Text>
                              <Text>
                                {new Date(
                                  viewingGoods.promotion.startDate
                                ).toLocaleString()}
                              </Text>
                            </div>
                          )}
                          {viewingGoods.promotion.endDate && (
                            <div>
                              <Text>End Date: </Text>
                              <Text>
                                {new Date(
                                  viewingGoods.promotion.endDate
                                ).toLocaleString()}
                              </Text>
                            </div>
                          )}
                          <div>
                            <Text>Status: </Text>
                            <Tag
                              color={
                                isPromotionActive(viewingGoods.promotion)
                                  ? "green"
                                  : "red"
                              }
                            >
                              {isPromotionActive(viewingGoods.promotion)
                                ? "Active"
                                : "Inactive"}
                            </Tag>
                          </div>
                        </Space>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </Modal>

          {/* Stock Update Modal */}
          <Modal
            title="Update Stock"
            visible={isStockModalVisible}
            onCancel={handleCancel}
            footer={[
              <Button key="cancel" onClick={handleCancel}>
                Cancel
              </Button>,
              <Button
                key="update"
                type="primary"
                onClick={handleStockUpdate}
                loading={loading}
              >
                Update Stock
              </Button>,
            ]}
          >
            {stockGoods && (
              <Form form={stockForm} layout="vertical">
                <div style={{ marginBottom: 16 }}>
                  <Text strong>{stockGoods.goods}</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text code style={{ fontSize: "12px" }}>
                      {stockGoods.code}
                    </Text>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Current Stock: {stockGoods.stock} {stockGoods.unit}
                    </Text>
                  </div>
                </div>
                <Form.Item
                  name="stock"
                  label={`New Stock Quantity (${stockGoods.unit})`}
                  rules={[
                    { required: true, message: "Please enter stock quantity" },
                    {
                      type: "number",
                      min: 0,
                      message: "Stock must be non-negative",
                    },
                  ]}
                >
                  <InputNumber
                    placeholder="Enter new stock quantity"
                    style={{ width: "100%" }}
                    min={0}
                    addonAfter={stockGoods.unit}
                  />
                </Form.Item>
              </Form>
            )}
          </Modal>
        </Content>
      </Layout>
    </Layout>
  );
};

export default GoodsPage;
