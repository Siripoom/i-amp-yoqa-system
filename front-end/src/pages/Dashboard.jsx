import { Layout, Row, Col, Card, Button, Progress } from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  CheckOutlined,
  UserOutlined,
} from "@ant-design/icons";
import "./Dashboard.css";
import Sidebar from "../components/Sidebar";
import "../components/Sidebar.css";
import Header from "../components/Header";
import "../components/Header.css";

const { Sider, Content } = Layout;

const DashboardPage = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider width={220} className="sidebar">
        <Sidebar />
      </Sider>

      {/* Main Content Area */}
      <Layout>
        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        <Content style={{ padding: "24px", backgroundColor: "#f4f6f8" }}>
          <h2 className="dashboard-title">Dashboard</h2>

          {/* Today's Sales Summary */}
          <Card className="summary-card">
            <div className="section-header">
              <h3>Today&apos;s Sales</h3>
              <Button type="primary" className="export-button">
                Export
              </Button>
            </div>
            <Row gutter={16}>
              <Col span={6}>
                <Card className="summary-item" hoverable>
                  <DollarOutlined className="summary-icon" />
                  <h4>$1k</h4>
                  <p>Total Sales</p>
                  <span className="summary-change">+8% from yesterday</span>
                </Card>
              </Col>
              <Col span={6}>
                <Card className="summary-item" hoverable>
                  <ShoppingCartOutlined className="summary-icon" />
                  <h4>300</h4>
                  <p>Total Order</p>
                  <span className="summary-change">+5% from yesterday</span>
                </Card>
              </Col>
              <Col span={6}>
                <Card className="summary-item" hoverable>
                  <CheckOutlined className="summary-icon" />
                  <h4>5</h4>
                  <p>Product Sold</p>
                  <span className="summary-change">+1.2% from yesterday</span>
                </Card>
              </Col>
              <Col span={6}>
                <Card className="summary-item" hoverable>
                  <UserOutlined className="summary-icon" />
                  <h4>8</h4>
                  <p>New Customers</p>
                  <span className="summary-change">+0.5% from yesterday</span>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* Top Products and Top Courses */}
          <Row gutter={24} className="top-sections">
            <Col span={12}>
              <Card title="Top Products" className="top-section-card">
                <Row className="top-item">
                  <Col span={12}>Home Decor</Col>
                  <Col span={6}>
                    <Progress percent={45} size="small" strokeColor="#40A9FF" />
                  </Col>
                  <Col span={6} className="top-sales">
                    45
                  </Col>
                </Row>
                <Row className="top-item">
                  <Col span={12}>Disney Princess Pink</Col>
                  <Col span={6}>
                    <Progress percent={29} size="small" strokeColor="#73D13D" />
                  </Col>
                  <Col span={6} className="top-sales">
                    29
                  </Col>
                </Row>
                {/* Add more products as needed */}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Top Courses" className="top-section-card">
                <Row className="top-item">
                  <Col span={12}>Home Decor</Col>
                  <Col span={6}>
                    <Progress percent={45} size="small" strokeColor="#40A9FF" />
                  </Col>
                  <Col span={6} className="top-sales">
                    45
                  </Col>
                </Row>
                <Row className="top-item">
                  <Col span={12}>Disney Princess Pink</Col>
                  <Col span={6}>
                    <Progress percent={29} size="small" strokeColor="#73D13D" />
                  </Col>
                  <Col span={6} className="top-sales">
                    29
                  </Col>
                </Row>
                {/* Add more courses as needed */}
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardPage;
