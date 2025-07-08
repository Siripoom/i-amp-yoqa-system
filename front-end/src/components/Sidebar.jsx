import { NavLink } from "react-router-dom";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  ReadOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  LogoutOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import "./Sidebar.css";
import logo from "../assets/images/logo.png";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="IAMPYOQA Logo" className="logo-icon" />
        <h2 className="logo-text">IAMPYOQA</h2>
      </div>
      <nav className="sidebar-nav">
        <NavLink
          to="/admin/dashboard"
          activeClassName="active"
          className="nav-item"
        >
          <DashboardOutlined /> <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/admin/orders"
          activeClassName="active"
          className="nav-item"
        >
          <ShoppingCartOutlined /> <span>Order</span>
        </NavLink>
        <NavLink
          to="/admin/productManage"
          activeClassName="active"
          className="nav-item"
        >
          <AppstoreOutlined /> <span>Promotion</span>
        </NavLink>
        <NavLink
          to="/admin/goods"
          activeClassName="active"
          className="nav-item"
        >
          <AppstoreOutlined /> <span>Product</span>
        </NavLink>
        <NavLink
          to="/admin/courses"
          activeClassName="active"
          className="nav-item"
        >
          <ReadOutlined /> <span>Courses</span>
        </NavLink>
        {/* <NavLink
          to="/admin/sales-report"
          activeClassName="active"
          className="nav-item"
        >
          <FileTextOutlined /> <span>Sales Report</span>
        </NavLink> */}
        <NavLink
          to="/admin/users"
          activeClassName="active"
          className="nav-item"
        >
          <UserOutlined /> <span>Users</span>
        </NavLink>
        <NavLink
          to="/admin/schedule"
          activeClassName="active"
          className="nav-item"
        >
          <CalendarOutlined /> <span>Schedule</span>
        </NavLink>
        <NavLink
          to="/admin/imageSetup"
          activeClassName="active"
          className="nav-item"
        >
          <FileImageOutlined /> <span>Image Setup</span>
        </NavLink>
        <NavLink
          to="/admin/master-report"
          activeClassName="active"
          className="nav-item"
        >
          <FileTextOutlined /> <span>Master Report</span>
        </NavLink>
        {/* <NavLink to="/" activeClassName="active" className="nav-item">
          <LogoutOutlined /> <span>Sign Out</span>
        </NavLink> */}
      </nav>
    </div>
  );
};

export default Sidebar;
