import { Layout, Card, Row, Col, Button } from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  CheckOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Bar } from "react-chartjs-2";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "./Dashboard.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

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

const Dashboard = () => {
  const productsData = [
    { name: "Home Decor", popularity: 45, sales: 45, color: "#3b82f6" },
    {
      name: "Disney Princess Pink",
      popularity: 29,
      sales: 29,
      color: "#10b981",
    },
    { name: "Bathroom", popularity: 18, sales: 18, color: "#a855f7" },
    { name: "Apple", popularity: 25, sales: 25, color: "#f97316" },
  ];

  const revenueData = {
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
  };
  const coursesData = [
    { name: "UI Design", popularity: 50, sales: 50, color: "#3498db" },
    { name: "React Basics", popularity: 30, sales: 30, color: "#2ecc71" },
    {
      name: "Advanced JavaScript",
      popularity: 20,
      sales: 20,
      color: "#9b59b6",
    },
    {
      name: "Python for Data Science",
      popularity: 15,
      sales: 15,
      color: "#e67e22",
    },
  ];
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
              <Button className="export-button">Export</Button>
            </div>

            <Row gutter={[16, 16]} className="w-full" justify="space-around">
              <Col xs={24} sm={12} lg={6}>
                <Card className="summary-item" hoverable>
                  <DollarOutlined
                    className="summary-icon"
                    style={{ color: "#f87171", fontSize: 30 }}
                  />
                  <h4>$1k</h4>
                  <p>Total Sales</p>
                  <span className="summary-change">+8% from yesterday</span>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="summary-item" hoverable>
                  <ShoppingCartOutlined
                    className="summary-icon"
                    style={{ color: "#fbbf24", fontSize: 30 }}
                  />
                  <h4>300</h4>
                  <p>Total Order</p>
                  <span className="summary-change">+5% from yesterday</span>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="summary-item" hoverable>
                  <CheckOutlined
                    className="summary-icon"
                    style={{ color: "#34d399", fontSize: 30 }}
                  />
                  <h4>5</h4>
                  <p>Product Sold</p>
                  <span className="summary-change">+1.2% from yesterday</span>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="summary-item" hoverable>
                  <UserOutlined
                    className="summary-icon"
                    style={{ color: "#a78bfa", fontSize: 30 }}
                  />
                  <h4>8</h4>
                  <p>New Customers</p>
                  <span className="summary-change">+0.5% from yesterday</span>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* Top Products and Top Courses */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
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
            </Col>

            <Col span={24}>
              <Card className="total-revenue-card">
                <h3 className="card-header">Total Revenue</h3>
                <Bar
                  className="total-revenue-chart"
                  data={revenueData}
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
