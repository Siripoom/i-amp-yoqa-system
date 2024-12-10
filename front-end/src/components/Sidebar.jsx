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
} from "@ant-design/icons";
import "./Sidebar.css";
import logo from "../assets/logo.webp";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="IAMPYOQA Logo" className="logo-icon" />
        <h2 className="logo-text">IAMPYOQA</h2>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" activeClassName="active" className="nav-item">
          <DashboardOutlined /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/orders" activeClassName="active" className="nav-item">
          <ShoppingCartOutlined /> <span>Order</span>
        </NavLink>
        <NavLink
          to="/productManage"
          activeClassName="active"
          className="nav-item"
        >
          <AppstoreOutlined /> <span>Products</span>
        </NavLink>
        <NavLink to="/courses" activeClassName="active" className="nav-item">
          <ReadOutlined /> <span>Courses</span>
        </NavLink>
        <NavLink
          to="/sales-report"
          activeClassName="active"
          className="nav-item"
        >
          <FileTextOutlined /> <span>Sales Report</span>
        </NavLink>
        <NavLink to="/users" activeClassName="active" className="nav-item">
          <UserOutlined /> <span>Users</span>
        </NavLink>
        <NavLink
          to="/class-schedule"
          activeClassName="active"
          className="nav-item"
        >
          <CalendarOutlined /> <span>Class Schedule</span>
        </NavLink>
        <NavLink to="/sign-out" activeClassName="active" className="nav-item">
          <LogoutOutlined /> <span>Sign Out</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
