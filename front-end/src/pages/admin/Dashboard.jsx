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

  // State สำหรับข้อมูลปีก่อนหน้า
  const [lastYearOrders, setLastYearOrders] = useState([]);
  const [lastYearTotalSales, setLastYearTotalSales] = useState(0);
  const [lastYearUsers, setLastYearUsers] = useState([]);
  const [lastYearCourses, setLastYearCourses] = useState([]);

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

        // กรอง courses ที่สร้างในปีปัจจุบัน
        const currentYear = new Date().getFullYear();
        const filteredCourses = response.courses.filter((course) => {
          if (course.created_at) {
            const courseYear = new Date(course.created_at).getFullYear();
            return courseYear === currentYear;
          }
          return false;
        });
        setLastYearCourses(filteredCourses);
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

        // กรองผู้ใช้ที่สร้างในปีปัจจุบัน
        const currentYear = new Date().getFullYear();
        const filteredUsers = response.users.filter((user) => {
          if (user.created_at) {
            const userYear = new Date(user.created_at).getFullYear();
            return userYear === currentYear;
          }
          return false;
        });
        setLastYearUsers(filteredUsers);
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

        // กรองคำสั่งซื้อที่สั่งในปีปัจจุบัน
        const currentYear = new Date().getFullYear();
        const filteredOrders = response.data.filter((order) => {
          if (order.order_date) {
            const orderYear = new Date(order.order_date).getFullYear();
            return orderYear === currentYear;
          }
          return false;
        });
        setLastYearOrders(filteredOrders);

        // คำนวณยอดขายของปีปัจจุบัน
        const currentYearTotal = filteredOrders.reduce((sum, order) => {
          return sum + (order.product_id?.price || 0);
        }, 0);
        setLastYearTotalSales(currentYearTotal);
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

  // ฟังก์ชันคำนวณข้อมูล Revenue จากข้อมูลจริง
  const calculateRevenueData = (timeframe) => {
    if (!orders || orders.length === 0) {
      return {
        labels: [],
        datasets: [
          { label: "Products", backgroundColor: "#3b82f6", data: [] },
          { label: "Courses", backgroundColor: "#10b981", data: [] },
        ],
      };
    }

    const now = new Date();
    let labels = [];
    let productData = [];
    let courseData = [];

    if (timeframe === "weekly") {
      // สัปดาห์ที่แล้ว (7 วัน)
      labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      productData = new Array(7).fill(0);
      courseData = new Array(7).fill(0);

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // เริ่มจันทร์
      startOfWeek.setHours(0, 0, 0, 0);

      orders.forEach((order) => {
        if (order.order_date) {
          const orderDate = new Date(order.order_date);
          const daysDiff = Math.floor((orderDate - startOfWeek) / (1000 * 60 * 60 * 24));

          if (daysDiff >= 0 && daysDiff < 7) {
            const price = order.product_id?.price || 0;
            // ใช้ order_type แทนการตรวจสอบ product_id
            if (order.order_type === "product") {
              productData[daysDiff] += price;
            } else if (order.order_type === "goods") {
              courseData[daysDiff] += price;
            }
          }
        }
      });
    } else if (timeframe === "monthly") {
      // เดือนนี้ แบ่งเป็น 4 สัปดาห์
      labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
      productData = new Array(4).fill(0);
      courseData = new Array(4).fill(0);

      orders.forEach((order) => {
        if (order.order_date) {
          const orderDate = new Date(order.order_date);
          if (orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) {
            const weekIndex = Math.min(Math.floor((orderDate.getDate() - 1) / 7), 3);
            const price = order.product_id?.price || 0;

            if (order.order_type === "product") {
              productData[weekIndex] += price;
            } else if (order.order_type === "goods") {
              courseData[weekIndex] += price;
            }
          }
        }
      });
    } else if (timeframe === "yearly") {
      // ปีนี้ แบ่งเป็น 12 เดือน
      labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      productData = new Array(12).fill(0);
      courseData = new Array(12).fill(0);

      orders.forEach((order) => {
        if (order.order_date) {
          const orderDate = new Date(order.order_date);
          if (orderDate.getFullYear() === now.getFullYear()) {
            const monthIndex = orderDate.getMonth();
            const price = order.product_id?.price || 0;

            if (order.order_type === "product") {
              productData[monthIndex] += price;
            } else if (order.order_type === "goods") {
              courseData[monthIndex] += price;
            }
          }
        }
      });
    }

    return {
      labels,
      datasets: [
        {
          label: "Products",
          backgroundColor: "#3b82f6",
          data: productData,
        },
        {
          label: "Courses",
          backgroundColor: "#10b981",
          data: courseData,
        },
      ],
    };
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
                  This Year Sales ({new Date().getFullYear()})
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
                  <h4>{lastYearTotalSales.toLocaleString()} THB</h4>
                  <p>Total Sales</p>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card className="summary-item" hoverable>
                  <ShoppingCartOutlined
                    className="summary-icon"
                    style={{ color: "#fbbf24", fontSize: 30 }}
                  />
                  <h4>{lastYearOrders.length}</h4>
                  <p>Total Order</p>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="summary-item" hoverable>
                  <CheckOutlined
                    className="summary-icon"
                    style={{ color: "#34d399", fontSize: 30 }}
                  />
                  <h4>{lastYearCourses.length}</h4>
                  <p>Product Sold</p>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="summary-item" hoverable>
                  <UserOutlined
                    className="summary-icon"
                    style={{ color: "#a78bfa", fontSize: 30 }}
                  />
                  <h4>{lastYearUsers.length}</h4>
                  <p>New Customers</p>
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
                  data={calculateRevenueData(timeframe)}
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
