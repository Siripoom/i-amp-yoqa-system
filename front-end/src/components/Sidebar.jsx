import { NavLink } from "react-router-dom";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  ReadOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  FileImageOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import "./Sidebar.css";
import { brand } from "../config/brand.js";

const Sidebar = () => {
  // Get user role from localStorage
  const userRole = localStorage.getItem("role");

  // Define which roles can see restricted menus
  const canSeeImageSetup = userRole === "SuperAdmin" || userRole === "Admin";
  const canSeeMasterReport = userRole === "SuperAdmin" || userRole === "Admin";

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img
          src={brand.logoPath}
          alt={`โลโก้ ${brand.name}`}
          className="logo-icon"
        />
      </div>
      <nav className="sidebar-nav">
        <NavLink
          to="/admin/dashboard"
          activeClassName="active"
          className="nav-item"
        >
          <DashboardOutlined /> <span>แดชบอร์ด</span>
        </NavLink>
          <NavLink
            to="/admin/schedule"
            activeClassName="active"
            className="nav-item"
          >
            <CalendarOutlined /> <span>ตารางเรียน</span>
          </NavLink>
          <NavLink
            to="/admin/terms"
            activeClassName="active"
            className="nav-item"
          >
            <ReadOutlined /> <span>ข้อกำหนด</span>
          </NavLink>
          <NavLink
            to="/admin/users"
            activeClassName="active"
            className="nav-item"
          >
            <UserOutlined /> <span>ผู้ใช้</span>
          </NavLink>
        <NavLink
          to="/admin/orders"
          activeClassName="active"
          className="nav-item"
        >
          <ShoppingCartOutlined /> <span>คำสั่งซื้อ</span>
        </NavLink>
        <NavLink
          to="/admin/productManage"
          activeClassName="active"
          className="nav-item"
        >
          <AppstoreOutlined /> <span>คอร์ส</span>
        </NavLink>
        <NavLink
          to="/admin/goods"
          activeClassName="active"
          className="nav-item"
        >
          <AppstoreOutlined /> <span>สินค้า</span>
        </NavLink>
        <NavLink
          to="/admin/courses"
          activeClassName="active"
          className="nav-item"
        >
          <ReadOutlined /> <span>คลาส</span>
        </NavLink>
        {/* <NavLink
          to="/"
          activeClassName="active"
          className="nav-item"
        >
          <FileTextOutlined /> <span>หน้าหลัก</span>
        </NavLink> */}
        <NavLink
          to="/admin/finance"
          activeClassName="active"
          className="nav-item"
        >
          <DollarOutlined /> <span>การเงิน</span>
        </NavLink>
        {canSeeImageSetup && (
          <NavLink
            to="/admin/imageSetup"
            activeClassName="active"
            className="nav-item"
          >
            <FileImageOutlined /> <span>จัดการรูปภาพ</span>
          </NavLink>
        )}
        {canSeeMasterReport && (
          <NavLink
            to="/admin/master-report"
            activeClassName="active"
            className="nav-item"
          >
            <FileTextOutlined /> <span>รายงานรวม</span>
          </NavLink>
        )}
        {/* <NavLink to="/" activeClassName="active" className="nav-item">
          <LogoutOutlined /> <span>ออกจากระบบ</span>
        </NavLink> */}
      </nav>
    </div>
  );
};

export default Sidebar;
