import { useState, useEffect } from "react";
import { Layout, Card, Row, Col, Button, Select, message } from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  CheckOutlined,
  UserOutlined,
  DownloadOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { Bar } from "react-chartjs-2";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import "../../styles/Dashboard.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { getUsers } from "../../services/userService";
import orderService from "../../services/orderService";
import { getCourses } from "../../services/courseService";
// Register the components to make the Bar chart work
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
const { Sider, Content } = Layout;
const { Option } = Select;

const Dashboard = () => {
  const [timeframe, setTimeframe] = useState("weekly");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [totalSales, setTotalSales] = useState(0); // เก็บยอดขายรวมทั้งหมด
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchOrders();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await getCourses();
      if (response.status === "success") {
        setCourses(response.courses);
      } else {
        message.error("Failed to fetch courses.");
      }
    } catch (error) {
      message.error(`Failed to fetch courses: ${error.message}`);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response.status === "success") {
        setUsers(response.users); // Extract `users` from the response
      } else {
        message.error("Failed to fetch users.");
      }
    } catch (error) {
      message.error(`Failed to fetch users: ${error.message}`);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders();

      if (response.status === "success") {
        setOrders(response.data); // ✅ ดึงคำสั่งซื้อ

        // ✅ คำนวณผลรวมของราคาสินค้าทั้งหมด
        const total = response.data.reduce((sum, order) => {
          return sum + (order.product_id?.price || 0);
        }, 0);
        setTotalSales(total);
      } else {
        message.error("Failed to fetch orders.");
      }
    } catch (error) {
      message.error(`Failed to fetch orders: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับส่งออกข้อมูลเป็น CSV
  const exportDashboardToCSV = () => {
    try {
      setExportLoading(true);

      // สร้างข้อมูลสำหรับส่งออก
      const dashboardData = {
        totalSales,
        orders,
        courses,
        users,
      };

      if (!dashboardData.orders || dashboardData.orders.length === 0) {
        message.error("ไม่มีข้อมูลที่จะส่งออก");
        return;
      }

      // ข้อมูลสรุปยอดขาย
      const summary = {
        totalSales: dashboardData.totalSales || 0,
        totalOrders: dashboardData.orders.length || 0,
        totalProducts: dashboardData.courses?.length || 0,
        totalUsers: dashboardData.users?.length || 0,
      };

      // สร้างเนื้อหา CSV
      let csvContent = "DASHBOARD SUMMARY\n";
      csvContent +=
        "Total Sales (THB),Total Orders,Total Products,Total Users\n";
      csvContent += `${summary.totalSales},${summary.totalOrders},${summary.totalProducts},${summary.totalUsers}\n\n`;

      // เพิ่มข้อมูลคำสั่งซื้อ
      csvContent += "ORDER DETAILS\n";
      csvContent += "Order ID,User,Product,Price,Status,Order Date\n";

      dashboardData.orders.forEach((order) => {
        const orderId = order._id || "N/A";
        const user = order.user_id
          ? `${order.user_id.first_name || ""} ${
              order.user_id.last_name || ""
            }`.trim()
          : "N/A";
        const product = order.product_id
          ? `Session: ${order.product_id.sessions || "N/A"}`
          : "N/A";
        const price = order.product_id ? order.product_id.price || 0 : 0;
        const status = order.status || "N/A";
        const orderDate = order.order_date
          ? new Date(order.order_date).toLocaleDateString()
          : "N/A";

        csvContent += `${orderId},${user.replace(/,/g, ";")},${product.replace(
          /,/g,
          ";"
        )},${price},${status.replace(/,/g, ";")},${orderDate}\n`;
      });

      // สร้าง blob สำหรับไฟล์ CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

      // สร้าง URL สำหรับดาวน์โหลด
      const url = window.URL.createObjectURL(blob);

      // สร้าง element a สำหรับดาวน์โหลด
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `dashboard_report_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);

      // คลิกลิงก์เพื่อดาวน์โหลด
      link.click();

      // ลบลิงก์ออกจาก DOM
      document.body.removeChild(link);

      // แสดงข้อความสำเร็จ
      message.success("ส่งออกข้อมูลแดชบอร์ดเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Error exporting dashboard data:", error);
      message.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    } finally {
      setExportLoading(false);
    }
  };

  const revenueDataOptions = {
    weekly: {
      labels: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      datasets: [
        {
          label: "Products",
          backgroundColor: "#3b82f6",
          data: [12000, 15000, 18000, 10000, 14000, 16000, 20000],
        },
        {
          label: "Courses",
          backgroundColor: "#10b981",
          data: [10000, 12000, 14000, 13000, 10000, 15000, 17000],
        },
      ],
    },
    monthly: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      datasets: [
        {
          label: "Products",
          backgroundColor: "#3b82f6",
          data: [45000, 52000, 48000, 50000],
        },
        {
          label: "Courses",
          backgroundColor: "#10b981",
          data: [35000, 40000, 38000, 42000],
        },
      ],
    },
    yearly: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Products",
          backgroundColor: "#3b82f6",
          data: [
            100000, 120000, 110000, 95000, 130000, 140000, 125000, 135000,
            145000, 150000, 160000, 170000,
          ],
        },
        {
          label: "Courses",
          backgroundColor: "#10b981",
          data: [
            90000, 100000, 95000, 85000, 110000, 120000, 105000, 115000, 125000,
            130000, 140000, 150000,
          ],
        },
      ],
    },
  };

  return (
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      {/* Sidebar */}
      <Sider width={220} className="lg:block hidden">
        <Sidebar />
      </Sider>

      <Layout>
        <Header title="Dashboard" />

        <Content className="dashboard-container">
          <Card className="sales-summary-card">
            <div className="sales-summary-header">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  Today Sales
                </h3>
                <p className="text-gray-500">Sales Summary</p>
              </div>
              <div>
                <Button
                  className="export-button mr-2"
                  icon={<DownloadOutlined />}
                  onClick={exportDashboardToCSV}
                  loading={exportLoading}
                >
                  Export CSV
                </Button>
              </div>
            </div>

            <Row gutter={[16, 16]} className="w-full" justify="space-around">
              <Col xs={24} sm={12} lg={6}>
                <Card className="summary-item" hoverable>
                  <DollarOutlined
                    className="summary-icon"
                    style={{ color: "#f87171", fontSize: 30 }}
                  />
                  <h4>{totalSales.toLocaleString()} THB</h4>{" "}
                  {/* ✅ แสดงผลรวม */}
                  <p>Total Sales</p>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="summary-item" hoverable>
                  <ShoppingCartOutlined
                    className="summary-icon"
                    style={{ color: "#fbbf24", fontSize: 30 }}
                  />
                  <h4>{orders.length}</h4>
                  <p>Total Order</p>
                  {/* <span className="summary-change">+5% from yesterday</span> */}
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="summary-item" hoverable>
                  <CheckOutlined
                    className="summary-icon"
                    style={{ color: "#34d399", fontSize: 30 }}
                  />
                  <h4>{courses.length}</h4>
                  <p>Product Sold</p>
                  {/* <span className="summary-change">+1.2% from yesterday</span> */}
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="summary-item" hoverable>
                  <UserOutlined
                    className="summary-icon"
                    style={{ color: "#a78bfa", fontSize: 30 }}
                  />
                  <h4>{users.length}</h4>
                  <p>New Customers</p>
                  {/* <span className="summary-change">+0.5% from yesterday</span> */}
                </Card>
              </Col>
            </Row>
          </Card>

          {/* Top Products and Top Courses */}
          <Row gutter={[16, 16]}>
            {/* <Col xs={24} lg={12}>
              <Card className="top-products-card">
                <h3 className="card-header">Top Products</h3>
                {productsData.map((product, index) => (
                  <div className="table-row" key={index}>
                    <span className="table-cell font-bold">{index + 1}</span>
                    <span className="table-cell">{product.name}</span>
                    <div className="popularity-bar">
                      <div
                        className="popularity-bar-fill"
                        style={{
                          width: `${product.popularity}%`,
                          backgroundColor: product.color,
                        }}
                      ></div>
                    </div>
                    <span
                      className="table-cell font-bold"
                      style={{ color: product.color }}
                    >
                      {product.sales}
                    </span>
                  </div>
                ))}
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card className="top-courses-card">
                <h3 className="card-header">Top Courses</h3>
                {coursesData.map((course, index) => (
                  <div className="table-row" key={index}>
                    <span className="table-cell font-bold">{index + 1}</span>
                    <span className="table-cell">{course.name}</span>
                    <div className="popularity-bar">
                      <div
                        className="popularity-bar-fill"
                        style={{
                          width: `${course.popularity}%`,
                          backgroundColor: course.color,
                        }}
                      ></div>
                    </div>
                    <span
                      className="table-cell font-bold"
                      style={{ color: course.color }}
                    >
                      {course.sales}
                    </span>
                  </div>
                ))}
              </Card>
            </Col> */}

            <Col span={24}>
              <Card className="total-revenue-card">
                <div className="revenue-header">
                  <h3 className="card-header">Total Revenue</h3>
                  <Select
                    defaultValue="weekly"
                    style={{ width: 120 }}
                    onChange={(value) => setTimeframe(value)}
                  >
                    <Option value="weekly">Weekly</Option>
                    <Option value="monthly">Monthly</Option>
                    <Option value="yearly">Yearly</Option>
                  </Select>
                </div>

                <Bar
                  className="total-revenue-chart"
                  data={revenueDataOptions[timeframe]}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                    },
                  }}
                />
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
