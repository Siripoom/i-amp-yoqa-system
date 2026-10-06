import { colors } from "../../theme/tokens.js";
import { useEffect, useState } from "react";
import {
  Layout,
  Table,
  Input,
  Button,
  Modal,
  Form,
  message,
  Upload,
  Tag,
  DatePicker,
  Switch,
  InputNumber,
  Select,
  Image,
  Space,
  Tooltip,
  Popconfirm,
  Card,
  Row,
  Col,
  Typography,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  FireOutlined,
  PercentageOutlined,
  TagsOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UndoOutlined,
  StopOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/Products.css";
import {
  getProductsWithComputedFields,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleHotSale,
  toggleActive,
  restoreProduct,
} from "../../services/productService";
import dayjs from "dayjs";
import { PRODUCT_CATEGORIES, getProductCategoryLabel } from "../../constants/productCategories";

const { Sider, Content } = Layout;
const { RangePicker } = DatePicker;
const { Title } = Typography;
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
    includeInactive: "true", // Admin should see inactive products
  });
  const [showDeleted, setShowDeleted] = useState(false);

  // Get user role from localStorage for permission control
  const userRole = localStorage.getItem("role");

  // Define permissions based on role
  const canCreate = userRole === "SuperAdmin" || userRole === "Admin";
  const canEdit = userRole === "SuperAdmin" || userRole === "Admin";
  const canDelete = userRole === "SuperAdmin";
  const canToggleHotSale = userRole === "SuperAdmin" || userRole === "Admin";

  useEffect(() => {
    fetchProducts();
  }, [filterOptions, showDeleted]);

  useEffect(() => {
    filterProducts();
  }, [searchText, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        ...filterOptions,
        includeDeleted: showDeleted ? "true" : "false",
      };
      const response = await getProductsWithComputedFields(params);
      if (response.status === "success") {
        setProducts(response.data);
      } else {
        message.error("โหลดสินค้าไม่สำเร็จ");
      }
    } catch (error) {
      message.error("โหลดสินค้าไม่สำเร็จ");
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
    if (!canCreate) {
      message.warning("คุณไม่มีสิทธิ์สร้างสินค้า");
      return;
    }
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    if (!canEdit && userRole !== "Accounting") {
      message.warning("คุณไม่มีสิทธิ์แก้ไขสินค้า");
      return;
    }
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
    // Check permissions
    if (userRole === "Accounting") {
      message.warning("คุณไม่มีสิทธิ์แก้ไขข้อมูลสินค้า");
      return;
    }

    if (editingProduct && !canEdit) {
      message.warning("คุณไม่มีสิทธิ์แก้ไขสินค้า");
      return;
    }

    if (!editingProduct && !canCreate) {
      message.warning("คุณไม่มีสิทธิ์สร้างสินค้า");
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);

      // Prepare promotion data
      let promotionData = null;

      // ตรวจสอบว่ามีข้อมูลโปรโมชั่นหรือไม่
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
        category: values.category,
        hotSale: values.hotSale || false,
        promotion: promotionData, // จะเป็น null ถ้าไม่มีโปรโมชั่น
        image: values.image,
      };

      console.log("Sending product data:", productData); // Debug log

      if (editingProduct) {
        await updateProduct(editingProduct._id, productData);
        message.success("แก้ไขสินค้าสำเร็จ");
      } else {
        await createProduct(productData);
        message.success("สร้างสินค้าสำเร็จ");
      }

      fetchProducts();
      setIsModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || error.message || "Failed to save product");
      console.error(error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!canDelete) {
      message.warning("คุณไม่มีสิทธิ์ลบสินค้า");
      return;
    }

    try {
      await deleteProduct(editingProduct._id);
      message.success("ลบสินค้าสำเร็จ");
      fetchProducts();
      setIsModalVisible(false);
    } catch (error) {
      message.error("ลบสินค้าไม่สำเร็จ");
    }
  };

  const handleToggleHotSale = async (productId, currentStatus) => {
    if (!canToggleHotSale) {
      message.warning("คุณไม่มีสิทธิ์แก้ไขสถานะลดราคาพิเศษ");
      return;
    }

    try {
      await toggleHotSale(productId);
      message.success(
        `Product ${!currentStatus ? "added to" : "removed from"} hot sale`
      );
      fetchProducts();
    } catch (error) {
      message.error("อัปเดตสถานะลดราคาพิเศษไม่สำเร็จ");
    }
  };

  const handleToggleActive = async (productId, currentStatus) => {
    if (!canEdit) {
      message.warning("คุณไม่มีสิทธิ์แก้ไขสถานะการใช้งาน");
      return;
    }

    try {
      await toggleActive(productId);
      message.success(
        `Product ${!currentStatus ? "activated" : "deactivated"} successfully`
      );
      fetchProducts();
    } catch (error) {
      message.error("อัปเดตสถานะการใช้งานไม่สำเร็จ");
    }
  };

  const handleRestore = async (productId) => {
    if (!canDelete) {
      message.warning("คุณไม่มีสิทธิ์กู้คืนสินค้า");
      return;
    }

    try {
      await restoreProduct(productId);
      message.success("กู้คืนสินค้าสำเร็จ");
      fetchProducts();
    } catch (error) {
      message.error("กู้คืนสินค้าไม่สำเร็จ");
    }
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const resetFilters = () => {
    setFilterOptions({
      hotSale: undefined,
      onPromotion: undefined,
      sortBy: "price",
      sortOrder: "asc",
      includeInactive: "true",
    });
    setSearchText("");
    setShowDeleted(false);
  };

  const formatPrice = (price) => {
    return `฿${price?.toLocaleString() || 0}`;
  };

  const columns = [
    {
      title: "รูปภาพ",
      dataIndex: "image",
      key: "image",
      width: 80,
      render: (image) =>
        image ? (
          <Image
            src={image}
            alt="สินค้า"
            width={50}
            height={50}
            style={{ objectFit: "cover", borderRadius: 4 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
          />
        ) : (
          <div className="w-12 h-12 bg-border rounded flex items-center justify-center">
            <span className="text-secondary text-xs">ไม่มีรูปภาพ</span>
          </div>
        ),
    },
    {
      title: "จำนวนครั้ง",
      dataIndex: "sessions",
      key: "sessions",
      sorter: (a, b) => a.sessions - b.sessions,
      render: (sessions) => <Tag color="processing">{sessions} Sessions</Tag>,
    },
    {
      title: "หมวดหมู่",
      dataIndex: "category",
      key: "category",
      render: getProductCategoryLabel,
    },
    {
      title: "ราคา",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
      render: (price, record) => (
        <div>
          {record.isPromotionActive && record.promotion?.price ? (
            <div>
              <div className="text-error font-bold">
                {formatPrice(record.promotion.price)}
              </div>
              <div className="text-secondary line-through text-sm">
                {formatPrice(price)}
              </div>
              <Tag color="error" size="small">
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
      title: "ระยะเวลา",
      dataIndex: "duration",
      key: "duration",
      sorter: (a, b) => a.duration - b.duration,
      render: (duration) => <Tag color="success">{duration} Days</Tag>,
    },
    {
      title: "สถานะ",
      key: "status",
      render: (record) => (
        <Space direction="vertical" size="small">
          <div>
            {record.isDeleted && (
              <Tag color="error" icon={<StopOutlined />}>
                ลบแล้ว
              </Tag>
            )}
            {!record.isDeleted && record.isActive === false && (
              <Tag color="default" icon={<EyeInvisibleOutlined />}>
                ไม่ใช้งาน
              </Tag>
            )}
            {!record.isDeleted && record.isActive !== false && (
              <Tag color="success" icon={<EyeOutlined />}>
                ใช้งาน
              </Tag>
            )}
          </div>
          <div>
            {record.hotSale && (
              <Tag color="warning" icon={<FireOutlined />}>
                ลดราคาพิเศษ
              </Tag>
            )}
            {record.isPromotionActive && (
              <Tag color="error" icon={<PercentageOutlined />}>
                อยู่ในโปรโมชัน
              </Tag>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 220,
      render: (record) => (
        <Space size="small" wrap>
          {/* Edit Button - disabled for deleted products */}
          {canEdit && !record.isDeleted && (
            <Tooltip title="แก้ไขสินค้า">
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => showEditModal(record)}
              />
            </Tooltip>
          )}

          {/* Toggle Active Button - only for non-deleted products */}
          {canEdit && !record.isDeleted && (
            <Popconfirm
              title={`${record.isActive !== false ? "Deactivate" : "Activate"} Product?`}
              description={`Are you sure you want to ${
                record.isActive !== false
                  ? "hide this product from customers"
                  : "show this product to customers"
              }?`}
              onConfirm={() => handleToggleActive(record._id, record.isActive !== false)}
              okText="ใช่"
              cancelText="ไม่ใช่"
            >
              <Tooltip
                title={
                  record.isActive !== false ? "ซ่อนจากลูกค้า" : "แสดงให้ลูกค้าเห็น"
                }
              >
                <Button
                  size="small"
                  icon={record.isActive !== false ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  type={record.isActive !== false ? "default" : "primary"}
                  style={record.isActive === false ? { backgroundColor: colors["success"], borderColor: colors["success"] } : {}}
                />
              </Tooltip>
            </Popconfirm>
          )}

          {/* Hot Sale Toggle - only for non-deleted products */}
          {canToggleHotSale && !record.isDeleted && (
            <Popconfirm
              title={`${record.hotSale ? "Remove from" : "Add to"} Hot Sale?`}
              description={`Are you sure you want to ${
                record.hotSale
                  ? "remove this product from"
                  : "add this product to"
              } hot sale?`}
              onConfirm={() => handleToggleHotSale(record._id, record.hotSale)}
              okText="ใช่"
              cancelText="ไม่ใช่"
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
          )}

          {/* Restore Button - only for deleted products */}
          {canDelete && record.isDeleted && (
            <Popconfirm
              title="กู้คืนสินค้า?"
              description="ยืนยันการกู้คืนสินค้านี้?"
              onConfirm={() => handleRestore(record._id)}
              okText="ใช่"
              cancelText="ไม่ใช่"
            >
              <Tooltip title="กู้คืนสินค้า">
                <Button
                  size="small"
                  icon={<UndoOutlined />}
                  type="primary"
                  style={{ backgroundColor: colors["success"], borderColor: colors["success"] }}
                />
              </Tooltip>
            </Popconfirm>
          )}
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
        <Header title="จัดการสินค้า" />

        <Content className="product-container p-6">
          {userRole === "Accounting" && (
            <div style={{
              background: "var(--color-warning-soft)",
              border: "1px solid var(--color-warning-soft)",
              borderRadius: "4px",
              padding: "8px 12px",
              marginBottom: "16px",
              color: colors["warning"]
            }}>
              📖 You are in view-only mode. You can view product information but cannot make changes.
            </div>
          )}
          <div className="product-header mb-6">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Title level={2} style={{ margin: 0 }}>
                Products ({filteredProducts.length})
              </Title>
            </div>
          </div>

          <Card className="mb-6">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={6}>
                <Input
                  placeholder="ค้นหาจำนวนครั้ง ราคา หรือระยะเวลา..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={handleSearch}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Space>
                  <Switch
                    checked={showDeleted}
                    onChange={(checked) => setShowDeleted(checked)}
                    checkedChildren="ลบแล้ว"
                    unCheckedChildren="ใช้งาน"
                  />
                  <span style={{ fontSize: '12px', color: colors["secondary"] }}>
                    {showDeleted ? 'แสดงรายการที่ลบแล้ว' : 'ซ่อนรายการที่ลบแล้ว'}
                  </span>
                </Space>
              </Col>
              <Col xs={24} sm={12} md={2}>
                <Button onClick={resetFilters} type="default">
                  รีเซ็ต
                </Button>
              </Col>
              {canCreate && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={showCreateModal}
                >
                  สร้างสินค้า
                </Button>
              )}
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
              editingProduct && canDelete && (
                <Popconfirm
                  key="delete"
                  title="ลบสินค้า"
                  description="ยืนยันการลบสินค้านี้? ไม่สามารถย้อนกลับได้"
                  onConfirm={handleDelete}
                  okText="ใช่"
                  cancelText="ไม่ใช่"
                  okType="danger"
                >
                  <Button
                    type="danger"
                    icon={<DeleteOutlined />}
                    loading={loading}
                  >
                    ลบ
                  </Button>
                </Popconfirm>
              ),
              <Button key="cancel" onClick={handleCancel}>
                ยกเลิก
              </Button>,
              // Only show Save button if user has permission to create/edit
              (canCreate || canEdit) && (
                <Button
                  key="save"
                  type="primary"
                  onClick={handleSave}
                  loading={loading}
                >
                  {editingProduct ? "Update" : "Create"}
                </Button>
              ),
            ].filter(Boolean)} // Remove null/undefined elements
          >
            <Form form={form} layout="vertical" className="mt-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="sessions"
                    label="จำนวนครั้ง"
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
                      placeholder="ระบุจำนวนครั้ง"
                      style={{ width: "100%" }}
                      min={1}
                      disabled={userRole === "Accounting"}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="price"
                    label="ราคา (฿)"
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
                      placeholder="ระบุราคา"
                      style={{ width: "100%" }}
                      min={0}
                      formatter={(value) =>
                        `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/฿\s?|(,*)/g, "")}
                      disabled={userRole === "Accounting"}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="duration"
                    label="ระยะเวลา (วัน)"
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
                      placeholder="ระบุระยะเวลาเป็นวัน"
                      style={{ width: "100%" }}
                      min={1}
                      disabled={userRole === "Accounting"}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="category"
                    label="หมวดหมู่โปรโมชั่น"
                    rules={[{ required: true, message: "กรุณาเลือกหมวดหมู่โปรโมชั่น" }]}
                  >
                    <Select
                      placeholder="เลือกหมวดหมู่โปรโมชั่น"
                      options={PRODUCT_CATEGORIES}
                      disabled={userRole === "Accounting"}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="hotSale"
                    label="ลดราคาพิเศษ"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="ลดราคาพิเศษ"
                      unCheckedChildren="ปกติ"
                      disabled={userRole === "Accounting"}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div className="flex justify-between items-center mb-4">
                <h4>ตั้งค่าโปรโมชัน</h4>
                {userRole !== "Accounting" && (
                  <Button
                    danger
                    size="small"
                    onClick={() => {
                      form.setFieldsValue({
                        promotionPrice: null,
                        promotionDateRange: null,
                      });
                      message.success("ล้างโปรโมชันแล้ว");
                    }}
                  >
                    ล้างโปรโมชัน
                  </Button>
                )}
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="promotionPrice"
                    label="ราคาโปรโมชัน (฿)"
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
                      placeholder="ระบุราคาโปรโมชัน"
                      style={{ width: "100%" }}
                      min={0}
                      formatter={(value) =>
                        `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) => value.replace(/฿\s?|(,*)/g, "")}
                      disabled={userRole === "Accounting"}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="promotionDateRange"
                    label="ช่วงโปรโมชัน"
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
                      disabled={userRole === "Accounting"}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="image" label="รูปสินค้า">
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
                    showRemoveIcon: userRole !== "Accounting",
                  }}
                  disabled={userRole === "Accounting"}
                >
                  {userRole !== "Accounting" && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>อัปโหลดรูปภาพ</div>
                    </div>
                  )}
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
