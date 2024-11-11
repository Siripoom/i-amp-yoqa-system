import { Layout, Row, Col, Card, Button } from "antd";
import "./Dashboard.css";

const { Content } = Layout;

const Dashboard = () => {
  return (
    <Content className="dashboard-content">
      <h2 className="dashboard-title">Dashboard</h2>

      {/* Today's Sales Summary */}
      <Card className="summary-card">
        <div className="section-header">
          <h3>Todays Sales</h3>
          <Button type="primary" className="export-button">
            Export
          </Button>
        </div>
        <Row gutter={[16, 16]} className="summary-row">
          <Col span={6}>
            <Card className="summary-item" hoverable>
              <h4>Total Sales</h4>
              <p>$1k</p>
              <span>+8% from yesterday</span>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="summary-item" hoverable>
              <h4>Total Order</h4>
              <p>300</p>
              <span>+5% from yesterday</span>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="summary-item" hoverable>
              <h4>Product Sold</h4>
              <p>5</p>
              <span>+1.2% from yesterday</span>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="summary-item" hoverable>
              <h4>New Customers</h4>
              <p>8</p>
              <span>+0.5% from yesterday</span>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Top Products and Top Courses */}
      <Row gutter={24} className="top-sections">
        <Col span={12}>
          <Card title="Top Products" className="top-section-card">
            <p>Placeholder for Top Products</p>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Top Courses" className="top-section-card">
            <p>Placeholder for Top Courses</p>
          </Card>
        </Col>
      </Row>
    </Content>
  );
};

export default Dashboard;
