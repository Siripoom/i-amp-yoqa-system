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
  Tabs,
  Badge,
  Space,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  AppstoreOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import orderService from "../../services/orderService";
import receiptService from "../../services/receiptService";
import { getUsers } from "../../services/userService";
import { getProducts } from "../../services/productService";
import goodsService from "../../services/goods-service"; // Import goods service
import "../../styles/Order.css";

const { Sider, Content } = Layout;
const { Option } = Select;
const { TabPane } = Tabs;

const OrderPage = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [productOrders, setProductOrders] = useState([]);
  const [goodsOrders, setGoodsOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [newInvoice, setNewInvoice] = useState("");

  // Get user role from localStorage for permission control
  const userRole = localStorage.getItem("role");

  // Define permissions based on role
  const canCreate = userRole === "SuperAdmin" || userRole === "Admin" || userRole === "Accounting";
  const canEdit = userRole === "SuperAdmin" || userRole === "Admin"; // Admin can now approve orders
  const canDelete = userRole === "SuperAdmin"; // Only SuperAdmin can delete
  const canView = userRole === "SuperAdmin" || userRole === "Admin" || userRole === "Accounting";

  // Create order modal states
  const [createOrderModalVisible, setCreateOrderModalVisible] = useState(false);
  const [createOrderForm] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [goods, setGoods] = useState([]);
  const [createOrderLoading, setCreateOrderLoading] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState("product");

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchUsers(),
        fetchProducts(),
        fetchGoods(),
      ]);
    } catch {
      message.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await orderService.getAllOrders();
      const orders = response.data || response || [];
      setAllOrders(orders);

      // แยก orders ตามประเภท
      const productOrdersList = orders.filter(
        (order) => order.order_type === "product"
      );
      const goodsOrdersList = orders.filter(
        (order) => order.order_type === "goods"
      );

      setProductOrders(productOrdersList);
      setGoodsOrders(goodsOrdersList);
    } catch {
      message.error("Failed to load orders");
      setAllOrders([]);
      setProductOrders([]);
      setGoodsOrders([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response.status === "success") {
        setUsers(response.users);
      }
    } catch {
      console.error("Error fetching users:", "Failed to fetch users");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      if (response.status === "success") {
        setProducts(response.data);
      }
    } catch {
      console.error("Error fetching products:", "Failed to fetch products");
    }
  };

  const fetchGoods = async () => {
    try {
      const response = await goodsService.getAllGoods();
      if (response.status === "success") {
        setGoods(response.data || []);
      }
    } catch {
      console.error("Error fetching goods:", "Failed to fetch goods");
    }
  };

  // ✅ แสดง Modal และตั้งค่าข้อมูล Order
  const showModal = (order) => {
    if (!canView) {
      message.warning("You don't have permission to view order details.");
      return;
    }
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNewInvoice(order.invoice_number || "");
    setIsModalVisible(true);
  };

  // ✅ ปิด Modal
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // ✅ อัปเดตสถานะ Order
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    if (!canEdit) {
      message.warning("You don't have permission to update orders.");
      return;
    }

    try {
      await orderService.updateOrderStatus(
        selectedOrder._id,
        newStatus,
        newInvoice
      );
      message.success("Order status updated successfully.");
      fetchOrders();
      setIsModalVisible(false);
    } catch {
      message.error("Failed to update order status.");
    }
  };

  // ✅ ลบคำสั่งซื้อ
  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;

    if (!canDelete) {
      message.warning("You don't have permission to delete orders.");
      return;
    }

    try {
      await orderService.deleteOrder(selectedOrder._id);
      message.success("Order deleted successfully.");
      fetchOrders();
      setIsModalVisible(false);
    } catch {
      message.error("Failed to delete order.");
    }
  };

  // ✅ สร้างใบเสร็จสำหรับ Order
  const handleCreateReceipt = async (order) => {
    try {
      // ตรวจสอบว่าใบเสร็จถูกสร้างไปแล้วหรือไม่
      try {
        const existingReceipt = await receiptService.getReceiptByOrderId(order._id);
        if (existingReceipt.success && existingReceipt.data) {
          message.warning(`ใบเสร็จถูกสร้างไปแล้ว : ${existingReceipt.data.receiptNumber}`);
          return;
        }
      } catch (checkError) {
        // ถ้าไม่พบใบเสร็จ ให้ดำเนินการสร้างต่อไป
        console.log('No existing receipt found, proceeding to create new one');
      }

      // Extract customer name from different possible sources
      let customerName = "ลูกค้า";
      if (order.user_id && order.user_id.name) {
        customerName = order.user_id.name;
      } else if (order.user_id && order.user_id.first_name && order.user_id.last_name) {
        customerName = `${order.user_id.first_name} ${order.user_id.last_name}`;
      } else if (order.user_name) {
        customerName = order.user_name;
      } else if (order.customer_name) {
        customerName = order.customer_name;
      }

      // Extract customer phone
      let customerPhone = "";
      if (order.phone_number) {
        customerPhone = order.phone_number;
      } else if (order.user_id && order.user_id.phone) {
        customerPhone = order.user_id.phone;
      } else if (order.user_id && order.user_id.phone_number) {
        customerPhone = order.user_id.phone_number;
      }

      // Extract customer address
      let customerAddress = order.address || "";
      if (!customerAddress && order.user_id && order.user_id.address) {
        customerAddress = order.user_id.address;
      }

      // Extract product/item name and total amount
      let itemName = "สินค้า";
      let totalAmount = 0;

      if (order.product_name) {
        itemName = order.product_name;
      } else if (order.goods_name) {
        itemName = order.goods_name;
      } else if (order.product_id && order.product_id.name) {
        itemName = order.product_id.name;
      } else if (order.goods_id && order.goods_id.name) {
        itemName = order.goods_id.name;
      }

      totalAmount = order.total_price || order.totalAmount || 0;

      const receiptData = {
        orderId: order._id,
        customerName: customerName,
        customerPhone: customerPhone,
        customerAddress: customerAddress,
        companyInfo: {
          name: "YOQA Studio",
          address: "123 ถนนสุขุมวิท กรุงเทพฯ 10110",
          phone: "02-xxx-xxxx"
        },
        items: [{
          name: itemName,
          quantity: order.quantity || 1,
          price: order.unit_price || totalAmount
        }],
        totalAmount: totalAmount,
        template: "default"
      };

      console.log('Receipt data being sent:', receiptData); // เพื่อ debug
      console.log('Original order data:', order); // เพื่อ debug

      const receipt = await receiptService.createReceipt(receiptData);
      message.success(`สร้างใบเสร็จสำเร็จ: ${receipt.receiptNumber}`);

    } catch (error) {
      console.error('Error creating receipt:', error);
      const errorMessage = error?.message || "ไม่สามารถสร้างใบเสร็จได้";
      message.error(`เกิดข้อผิดพลาด: ${errorMessage}`);
    }
  };

  // ✅ แสดงสีของสถานะ Order
  const renderStatusTag = (status) => {
    const correctedStatus = status === "รออนุมติ" ? "รออนุมัติ" : status;
    const statusColors = {
      รออนุมัติ: "blue",
      อนุมัติ: "green",
      ยกเลิก: "red",
    };
    return (
      <Tag color={statusColors[correctedStatus] || "gray"}>
        {correctedStatus}
      </Tag>
    );
  };

  // Handle opening create order modal
  const showCreateOrderModal = () => {
    if (!canCreate) {
      message.warning("You don't have permission to create orders.");
      return;
    }
    createOrderForm.resetFields();
    setSelectedOrderType("product");
    setCreateOrderModalVisible(true);
  };

  // Handle creating a new order
  const handleCreateOrder = async (values) => {
    setCreateOrderLoading(true);
    try {
      let formData;

      if (selectedOrderType === "product") {
        formData = orderService.createProductOrderFormData({
          user_id: values.user_id,
          product_id: values.item_id,
          quantity: values.quantity || 1,
          image: values.image?.[0],
        });
      } else {
        formData = orderService.createGoodsOrderFormData({
          user_id: values.user_id,
          goods_id: values.item_id,
          quantity: values.quantity || 1,
          size: values.size,
          color: values.color,
          image: values.image?.[0],
        });
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

  // Render order type badge
  const renderOrderTypeBadge = (orderType) => {
    const config = {
      product: { color: "blue", icon: <AppstoreOutlined />, text: "Product" },
      goods: { color: "green", icon: <ShopOutlined />, text: "Goods" },
    };
    const { color, icon, text } = config[orderType] || config.product;

    return (
      <Tag color={color} icon={icon}>
        {text}
      </Tag>
    );
  };

  // Render item info
  const renderItemInfo = (record) => {
    if (record.order_type === "product" && record.product_id) {
      return `${record.product_id.sessions} Sessions`;
    } else if (record.order_type === "goods" && record.goods_id) {
      return record.goods_id.goods || "Unknown Goods";
    }
    return "N/A";
  };

  // Render item price with promotion support
  const renderItemPrice = (record) => {
    // ใช้ unit_price จาก order (ราคาที่จ่ายจริง) หากมี
    if (record.unit_price) {
      const item =
        record.order_type === "product" ? record.product_id : record.goods_id;
      const originalPrice = item?.price;

      // ถ้าราคาที่จ่ายจริงต่างจากราคาต้นฉบับ แสดงว่ามีโปรโมชั่น
      if (originalPrice && record.unit_price < originalPrice) {
        const discountPercent = Math.round(
          ((originalPrice - record.unit_price) / originalPrice) * 100
        );
        return (
          <div>
            <div className="text-red-600 font-semibold">
              ฿{record.unit_price.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 line-through">
              ฿{originalPrice.toLocaleString()}
            </div>
            <Tag color="red" size="small">
              -{discountPercent}%
            </Tag>
          </div>
        );
      } else {
        return `฿${record.unit_price.toLocaleString()}`;
      }
    }

    // Fallback ใช้ราคาจากสินค้า
    const item =
      record.order_type === "product" ? record.product_id : record.goods_id;
    return item ? `฿${item.price.toLocaleString()}` : "N/A";
  };


  // ✅ คอลัมน์ของตาราง - All Orders
  const allOrdersColumns = [
    {
      title: "TYPE",
      dataIndex: "order_type",
      key: "order_type",
      render: (orderType) => renderOrderTypeBadge(orderType),
      width: 100,
      responsive: ["sm"],
    },

    {
      title: "CODE",
      dataIndex: "user_id",
      key: "user_code",
      render: (user) => (user?.code || "N/A"),
      width: 120,
      ellipsis: true,
    },
    {
      title: "NAME",
      dataIndex: "user_id",
      key: "user_name",
      render: (user) => (user ? `${user.first_name} ${user.last_name}` : "N/A"),
      width: 150,
      ellipsis: true,
    },
    {
      title: "ITEM",
      key: "item",
      render: (record) => renderItemInfo(record),
      width: 150,
      ellipsis: true,
      responsive: ["md"],
    },
    {
      title: "PRICE",
      key: "item_price",
      render: (record) => renderItemPrice(record),
      width: 120,
    },
    {
      title: "QTY",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity) => quantity || 1,
      width: 60,
      responsive: ["sm"],
    },
    {
      title: "TOTAL",
      key: "total_price",
      render: (record) => {
        const totalPrice = record.total_price || 0;
        return `฿${totalPrice.toLocaleString()}`;
      },
      width: 100,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status) => renderStatusTag(status),
      width: 100,
    },
    {
      title: "DATE",
      dataIndex: "order_date",
      key: "order_date",
      render: (date) => new Date(date).toLocaleDateString(),
      width: 100,
      responsive: ["lg"],
    },
    {
      title: "ACTION",
      key: "action",
      render: (record) => (
        <Space size="small">
          {canView ? (
            <Tooltip title="แก้ไข">
              <Button
                icon={<EditOutlined />}
                shape="circle"
                onClick={() => showModal(record)}
                size="small"
              />
            </Tooltip>
          ) : (
            <Tooltip title="No permission">
              <Button
                icon={<EditOutlined />}
                shape="circle"
                size="small"
                disabled
              />
            </Tooltip>
          )}
          {canCreate && (
            <Tooltip title="สร้างใบเสร็จ">
              <Button
                icon={<FileTextOutlined />}
                shape="circle"
                onClick={() => handleCreateReceipt(record)}
                size="small"
                type="primary"
                ghost
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 120,
      fixed: "right",
    },
  ];

  // ✅ คอลัมน์ของตาราง - Product Orders
  const productOrdersColumns = [
    {
      title: "CODE",
      dataIndex: "user_id",
      key: "user_code",
      render: (user) => (user?.code || "N/A"),
      width: 120,
      ellipsis: true,
    },
    {
      title: "NAME",
      dataIndex: "user_id",
      key: "user_name",
      render: (user) => (user ? `${user.first_name} ${user.last_name}` : "N/A"),
      width: 150,
      ellipsis: true,
    },
    {
      title: "SESSIONS",
      dataIndex: "product_id",
      key: "sessions",
      render: (product) => (product ? `${product.sessions} Sessions` : "N/A"),
      responsive: ["md"],
    },
    {
      title: "DURATION",
      dataIndex: "product_id",
      key: "duration",
      render: (product) => (product ? `${product.duration} Days` : "N/A"),
      responsive: ["lg"],
    },
    {
      title: "PRICE",
      dataIndex: "product_id",
      key: "price",
      render: (product, record) => {
        // ใช้ unit_price จาก order หากมี (ราคาที่จ่ายจริง)
        if (record.unit_price) {
          const originalPrice = product?.price;

          // ถ้าราคาที่จ่ายจริงต่างจากราคาต้นฉบับ แสดงว่ามีโปรโมชั่น
          if (originalPrice && record.unit_price < originalPrice) {
            const discountPercent = Math.round(
              ((originalPrice - record.unit_price) / originalPrice) * 100
            );
            return (
              <div>
                <div className="text-red-600 font-semibold">
                  ฿{record.unit_price.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 line-through">
                  ฿{originalPrice.toLocaleString()}
                </div>
                <Tag color="red" size="small">
                  -{discountPercent}%
                </Tag>
              </div>
            );
          } else {
            return `฿${record.unit_price.toLocaleString()}`;
          }
        }

        // Fallback ใช้ราคาจากสินค้า
        return product ? `฿${product.price.toLocaleString()}` : "N/A";
      },
    },
    {
      title: "QTY",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity) => quantity || 1,
      responsive: ["sm"],
    },
    {
      title: "TOTAL",
      key: "total_price",
      render: (record) => `฿${(record.total_price || 0).toLocaleString()}`,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status) => renderStatusTag(status),
    },
    {
      title: "DATE",
      dataIndex: "order_date",
      key: "order_date",
      render: (date) => new Date(date).toLocaleDateString(),
      responsive: ["lg"],
    },
    {
      title: "ACTION",
      key: "action",
      render: (record) => (
        <Space size="small">
          {canView ? (
            <Tooltip title="แก้ไข">
              <Button
                icon={<EditOutlined />}
                shape="circle"
                onClick={() => showModal(record)}
                size="small"
              />
            </Tooltip>
          ) : (
            <Tooltip title="No permission">
              <Button
                icon={<EditOutlined />}
                shape="circle"
                size="small"
                disabled
              />
            </Tooltip>
          )}
          {canCreate && (
            <Tooltip title="สร้างใบเสร็จ">
              <Button
                icon={<FileTextOutlined />}
                shape="circle"
                onClick={() => handleCreateReceipt(record)}
                size="small"
                type="primary"
                ghost
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 120,
      fixed: "right",
    },
  ];

  // ✅ คอลัมน์ของตาราง - Goods Orders
  const goodsOrdersColumns = [
    {
      title: "GOODS",
      dataIndex: "goods_id",
      key: "goods",
      render: (goods) => (goods ? goods.goods : "N/A"),
      ellipsis: true,
    },
    {
      title: "CODE",
      dataIndex: "user_id",
      key: "user_code",
      render: (user) => (user?.code || "N/A"),
      width: 120,
      ellipsis: true,
      responsive: ["md"],
    },
    {
      title: "NAME",
      dataIndex: "user_id",
      key: "user_name",
      render: (user) => (user ? `${user.first_name} ${user.last_name}` : "N/A"),
      width: 150,
      ellipsis: true,
      responsive: ["md"],
    },
    {
      title: "SHIPPING INFO",
      key: "address_phone",
      render: (record) => {
        const address = record.shipping_address || record.address;
        const phone = record.shipping_phone || record.phone_number;

        if (!address && !phone)
          return <span className="text-gray-400">N/A</span>;

        return (
          <div className="text-sm">
            {address && (
              <div className="truncate max-w-xs">
                <strong>Address:</strong> {address}
              </div>
            )}
            {phone && (
              <div>
                <strong>Phone:</strong> {phone}
              </div>
            )}
          </div>
        );
      },
      responsive: ["lg"],
    },
    {
      title: "CODE",
      dataIndex: "goods_id",
      key: "code",
      render: (goods) =>
        goods?.code ? (
          <Tag color="geekblue" size="small">
            {goods.code}
          </Tag>
        ) : (
          "N/A"
        ),
      responsive: ["md"],
    },
    {
      title: "SIZE/COLOR",
      key: "size_color",
      render: (record) => (
        <Space size="small" wrap>
          {record.size && (
            <Tag color="blue" size="small">
              {record.size}
            </Tag>
          )}
          {record.color && (
            <Tag color="orange" size="small">
              {record.color}
            </Tag>
          )}
        </Space>
      ),
      responsive: ["sm"],
    },
    {
      title: "PRICE",
      dataIndex: "goods_id",
      key: "price",
      render: (goods, record) => {
        // ใช้ unit_price จาก order หากมี (ราคาที่จ่ายจริง)
        if (record.unit_price) {
          const originalPrice = goods?.price;

          // ถ้าราคาที่จ่ายจริงต่างจากราคาต้นฉบับ แสดงว่ามีโปรโมชั่น
          if (originalPrice && record.unit_price < originalPrice) {
            const discountPercent = Math.round(
              ((originalPrice - record.unit_price) / originalPrice) * 100
            );
            return (
              <div>
                <div className="text-red-600 font-semibold">
                  ฿{record.unit_price.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 line-through">
                  ฿{originalPrice.toLocaleString()}
                </div>
                <Tag color="red" size="small">
                  -{discountPercent}%
                </Tag>
              </div>
            );
          } else {
            return `฿${record.unit_price.toLocaleString()}`;
          }
        }

        // Fallback ใช้ราคาจากสินค้า
        return goods ? `฿${goods.price.toLocaleString()}` : "N/A";
      },
    },
    {
      title: "QTY",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity) => quantity || 1,
      responsive: ["sm"],
    },
    {
      title: "TOTAL",
      key: "total_price",
      render: (record) => `฿${(record.total_price || 0).toLocaleString()}`,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status) => renderStatusTag(status),
    },
    {
      title: "DATE",
      dataIndex: "order_date",
      key: "order_date",
      render: (date) => new Date(date).toLocaleDateString(),
      responsive: ["lg"],
    },
    {
      title: "ACTION",
      key: "action",
      render: (record) => (
        <Space size="small">
          {canView ? (
            <Tooltip title="แก้ไข">
              <Button
                icon={<EditOutlined />}
                shape="circle"
                onClick={() => showModal(record)}
                size="small"
              />
            </Tooltip>
          ) : (
            <Tooltip title="No permission">
              <Button
                icon={<EditOutlined />}
                shape="circle"
                size="small"
                disabled
              />
            </Tooltip>
          )}
          {canCreate && (
            <Tooltip title="สร้างใบเสร็จ">
              <Button
                icon={<FileTextOutlined />}
                shape="circle"
                onClick={() => handleCreateReceipt(record)}
                size="small"
                type="primary"
                ghost
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 120,
      fixed: "right",
    },
  ];

  // Filter data by status
  const filterByStatus = (orders) => {
    if (statusFilter === "all") return orders;

    return orders.filter((order) => {
      const normalizedStatus = order.status === "รออนุมติ" ? "รออนุมัติ" : order.status;

      if (statusFilter === "approved") return normalizedStatus === "อนุมัติ";
      if (statusFilter === "pending") return normalizedStatus === "รออนุมัติ";
      if (statusFilter === "cancelled") return normalizedStatus === "ยกเลิก";

      return true;
    });
  };

  // Get current data and columns based on active tab
  const getCurrentData = () => {
    let data, columns;

    switch (activeTab) {
      case "product":
        data = productOrders;
        columns = productOrdersColumns;
        break;
      case "goods":
        data = goodsOrders;
        columns = goodsOrdersColumns;
        break;
      default:
        data = allOrders;
        columns = allOrdersColumns;
    }

    // Apply status filter
    const filteredData = filterByStatus(data);

    return { data: filteredData, columns };
  };

  const { data: currentData, columns: currentColumns } = getCurrentData();

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider
        width={220}
        className="lg:block hidden"
        breakpoint="lg"
        collapsedWidth="0"
      >
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="Order Management" />

        <Content className="order-container p-2 sm:p-4 lg:p-6">
          {/* แสดงข้อความแจ้งเตือนสำหรับ role ที่มีข้อจำกัด */}
          {userRole === "Admin" && (
            <div style={{
              background: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "4px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "14px",
              color: "#856404"
            }}>
              <strong>⚠️ Admin Role:</strong> You can view and create orders but cannot delete existing orders.
            </div>
          )}

          {userRole === "Accounting" && (
            <div style={{
              background: "#d1ecf1",
              border: "1px solid #bee5eb",
              borderRadius: "4px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "14px",
              color: "#0c5460"
            }}>
              <strong>ℹ️ Accounting Role:</strong> You can view order information and create new orders.
            </div>
          )}

          <div className="order-header flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-bold m-0">Orders</h2>
              {canCreate && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={showCreateOrderModal}
                  className="create-order-button w-full sm:w-auto"
                  size="large"
                >
                  <span className="hidden sm:inline">Create Order</span>
                  <span className="sm:hidden">New Order</span>
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Filter by Status:</span>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 200 }}
                size="large"
              >
                <Option value="all">
                  <Space>
                    <Badge status="default" />
                    ทั้งหมด (All)
                  </Space>
                </Option>
                <Option value="pending">
                  <Space>
                    <Badge status="processing" />
                    รออนุมัติ (Pending)
                  </Space>
                </Option>
                <Option value="approved">
                  <Space>
                    <Badge status="success" />
                    อนุมัติ (Approved)
                  </Space>
                </Option>
                <Option value="cancelled">
                  <Space>
                    <Badge status="error" />
                    ยกเลิก (Cancelled)
                  </Space>
                </Option>
              </Select>
              <span className="text-sm text-gray-500">
                ({currentData.length} {currentData.length === 1 ? 'order' : 'orders'})
              </span>
            </div>
          </div>

          {/* Tabs สำหรับแยกประเภท Order */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ marginBottom: 16 }}
            size="large"
            className="order-tabs"
            tabBarStyle={{
              overflow: "auto",
              whiteSpace: "nowrap"
            }}
          >
            <TabPane
              tab={
                <Badge count={allOrders.length} offset={[10, 0]} size="small">
                  <Space size="small">
                    <ShoppingCartOutlined />
                    <span className="hidden sm:inline">All Orders</span>
                    <span className="sm:hidden">All</span>
                  </Space>
                </Badge>
              }
              key="all"
            />
            <TabPane
              tab={
                <Badge count={productOrders.length} offset={[10, 0]} size="small">
                  <Space size="small">
                    <AppstoreOutlined />
                    <span className="hidden sm:inline">Course Orders</span>
                    <span className="sm:hidden">Courses</span>
                  </Space>
                </Badge>
              }
              key="product"
            />
            <TabPane
              tab={
                <Badge count={goodsOrders.length} offset={[10, 0]} size="small">
                  <Space size="small">
                    <ShopOutlined />
                    <span className="hidden sm:inline">Goods Orders</span>
                    <span className="sm:hidden">Goods</span>
                  </Space>
                </Badge>
              }
              key="goods"
            />
          </Tabs>

          {/* ตารางแสดงคำสั่งซื้อ */}
          <div className="overflow-x-auto">
            <Table
              columns={currentColumns}
              dataSource={currentData}
              pagination={{
                position: ["bottomCenter"],
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                responsive: true
              }}
              rowKey="_id"
              loading={loading}
              scroll={{ x: 1200 }}
              size="small"
              className="responsive-table"
            />
          </div>

          {/* Modal แก้ไข / ลบคำสั่งซื้อ */}
          <Modal
            title="Manage Order"
            visible={isModalVisible}
            onCancel={handleCancel}
            width="90%"
            style={{ maxWidth: 600 }}
            footer={[
              ...(canDelete ? [
                <Button
                  key="delete"
                  type="danger"
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteOrder}
                  size="small"
                  className="mb-2 sm:mb-0"
                >
                  <span className="hidden sm:inline">Delete Order</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
              ] : []),
              <Button key="cancel" onClick={handleCancel} className="mb-2 sm:mb-0">
                Cancel
              </Button>,
              ...(canEdit ? [
                <Button key="update" type="primary" onClick={handleUpdateStatus}>
                  <span className="hidden sm:inline">Update Status</span>
                  <span className="sm:hidden">Update</span>
                </Button>
              ] : []),
            ]}
          >
            {selectedOrder && (
              <div>
                <div className="mb-4">
                  <p>
                    <strong>Order ID:</strong> {selectedOrder._id}
                  </p>
                  <p>
                    <strong>Order Type:</strong>{" "}
                    {renderOrderTypeBadge(selectedOrder.order_type)}
                  </p>
                  <p>
                    <strong>Current Status:</strong>{" "}
                    {renderStatusTag(selectedOrder.status)}
                  </p>

                  {/* แสดงข้อมูลราคาและโปรโมชั่น */}
                  <div className="mb-2">
                    <strong>Price Details:</strong>
                    <div className="mt-1">
                      {selectedOrder.unit_price ? (
                        <div>
                          <div>
                            Paid Price: ฿
                            {selectedOrder.unit_price.toLocaleString()}
                          </div>
                          {selectedOrder.order_type === "product" &&
                            selectedOrder.product_id &&
                            selectedOrder.unit_price <
                            selectedOrder.product_id.price && (
                              <div>
                                <span className="text-gray-500 line-through">
                                  Original: ฿
                                  {selectedOrder.product_id.price.toLocaleString()}
                                </span>
                                <Tag color="red" size="small" className="ml-2">
                                  Promotion Applied
                                </Tag>
                              </div>
                            )}
                          {selectedOrder.order_type === "goods" &&
                            selectedOrder.goods_id &&
                            selectedOrder.unit_price <
                            selectedOrder.goods_id.price && (
                              <div>
                                <span className="text-gray-500 line-through">
                                  Original: ฿
                                  {selectedOrder.goods_id.price.toLocaleString()}
                                </span>
                                <Tag color="red" size="small" className="ml-2">
                                  Promotion Applied
                                </Tag>
                              </div>
                            )}
                        </div>
                      ) : (
                        <div>Price: N/A</div>
                      )}
                      <div>Quantity: {selectedOrder.quantity || 1}</div>
                      <div>
                        Total: ฿
                        {(selectedOrder.total_price || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* แสดงข้อมูลเพิ่มเติมตาม order type */}
                  {selectedOrder.order_type === "goods" && (
                    <div className="mb-2">
                      <strong>Product Details:</strong>
                      <div className="mt-1">
                        <Space size="small">
                          {selectedOrder.size && (
                            <Tag color="blue">Size: {selectedOrder.size}</Tag>
                          )}
                          {selectedOrder.color && (
                            <Tag color="orange">
                              Color: {selectedOrder.color}
                            </Tag>
                          )}
                        </Space>
                      </div>
                    </div>
                  )}
                </div>

                {/* แสดงภาพหลักฐานการชำระเงิน */}
                {selectedOrder.image ? (
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <p>
                      <strong>Payment Slip:</strong>
                    </p>
                    <img
                      src={selectedOrder.image}
                      alt="Payment Slip"
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        borderRadius: "8px",
                        maxHeight: "300px",
                        objectFit: "contain"
                      }}
                    />
                  </div>
                ) : (
                  <p
                    style={{
                      color: "gray",
                      textAlign: "center",
                      marginBottom: "16px",
                    }}
                  >
                    No payment slip uploaded
                  </p>
                )}

                <Select
                  value={newStatus}
                  onChange={setNewStatus}
                  style={{ width: "100%", marginBottom: "12px" }}
                  disabled={!canEdit}
                >
                  <Option value="รออนุมัติ">รออนุมัติ</Option>
                  <Option value="อนุมัติ">อนุมัติ</Option>
                  <Option value="ยกเลิก">ยกเลิก</Option>
                </Select>

                <Input
                  value={newInvoice}
                  onChange={(e) => setNewInvoice(e.target.value)}
                  placeholder="Enter invoice number"
                  disabled={!canEdit}
                />
              </div>
            )}
          </Modal>

          {/* Modal สร้างคำสั่งซื้อใหม่ */}
          <Modal
            title="Create New Order"
            visible={createOrderModalVisible}
            onCancel={() => setCreateOrderModalVisible(false)}
            footer={null}
            width="95%"
            style={{ maxWidth: 700, top: 20 }}
          >
            <Form
              form={createOrderForm}
              layout="vertical"
              onFinish={handleCreateOrder}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="user_id"
                    label="Select User"
                    rules={[
                      { required: true, message: "Please select a user" },
                    ]}
                  >
                    <Select
                      placeholder="Select a user"
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children?.toString().toLowerCase() ?? '').includes(input.toLowerCase())
                      }
                    >
                      {users.map((user) => {
                        const userName = `${user.first_name} ${user.last_name}`;
                        const displayText = user.code ? `${user.code} (${userName})` : userName;
                        return (
                          <Option key={user._id} value={user._id}>
                            {displayText}
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Order Type"
                    rules={[
                      { required: true, message: "Please select order type" },
                    ]}
                  >
                    <Select
                      value={selectedOrderType}
                      onChange={setSelectedOrderType}
                      placeholder="Select order type"
                    >
                      <Option value="product">
                        <Space>
                          <AppstoreOutlined />
                          Course/Product
                        </Space>
                      </Option>
                      <Option value="goods">
                        <Space>
                          <ShopOutlined />
                          Goods
                        </Space>
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="item_id"
                label={
                  selectedOrderType === "product"
                    ? "Select Product"
                    : "Select Goods"
                }
                rules={[
                  {
                    required: true,
                    message: `Please select a ${selectedOrderType}`,
                  },
                ]}
              >
                <Select placeholder={`Select a ${selectedOrderType}`}>
                  {selectedOrderType === "product"
                    ? products.map((product) => (
                      <Option key={product._id} value={product._id}>
                        {product.sessions} Sessions - ฿{product.price}
                      </Option>
                    ))
                    : goods.map((goodsItem) => (
                      <Option key={goodsItem._id} value={goodsItem._id}>
                        {goodsItem.goods} - ฿{goodsItem.price}
                        {goodsItem.code && ` (${goodsItem.code})`}
                      </Option>
                    ))}
                </Select>
              </Form.Item>

              {/* Goods specific fields */}
              {selectedOrderType === "goods" && (
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="size" label="Size (Optional)">
                      <Input placeholder="Enter size" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="color" label="Color (Optional)">
                      <Input placeholder="Enter color" />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              <Form.Item name="quantity" label="Quantity" initialValue={1}>
                <Input type="number" min={1} />
              </Form.Item>

              <Form.Item
                name="image"
                label="Payment Slip (Optional)"
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
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

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button
                  onClick={() => setCreateOrderModalVisible(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createOrderLoading}
                  className="w-full sm:w-auto"
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
