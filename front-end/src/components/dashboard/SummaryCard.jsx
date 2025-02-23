import { Card } from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  CheckOutlined,
  UserOutlined,
} from "@ant-design/icons";

// eslint-disable-next-line react/prop-types
const SummaryCard = ({ type, value, change }) => {
  const icons = {
    sales: <DollarOutlined style={{ color: "#f87171", fontSize: 30 }} />,
    orders: <ShoppingCartOutlined style={{ color: "#fbbf24", fontSize: 30 }} />,
    sold: <CheckOutlined style={{ color: "#34d399", fontSize: 30 }} />,
    customers: <UserOutlined style={{ color: "#a78bfa", fontSize: 30 }} />,
  };

  const labels = {
    sales: "Total Sales",
    orders: "Total Orders",
    sold: "Product Sold",
    customers: "New Customers",
  };

  return (
    <Card className="summary-item" hoverable>
      {icons[type]}
      <h4>{value}</h4>
      <p>{labels[type]}</p>
      <span className="summary-change">{change}</span>
    </Card>
  );
};

export default SummaryCard;
