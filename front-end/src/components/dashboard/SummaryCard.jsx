import { colors } from "../../theme/tokens.js";
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
    sales: <DollarOutlined style={{ color: colors["error"], fontSize: 30 }} />,
    orders: <ShoppingCartOutlined style={{ color: colors["warning"], fontSize: 30 }} />,
    sold: <CheckOutlined style={{ color: colors["success"], fontSize: 30 }} />,
    customers: <UserOutlined style={{ color: colors["info"], fontSize: 30 }} />,
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
