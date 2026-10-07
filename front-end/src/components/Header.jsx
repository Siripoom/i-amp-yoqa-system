import { Button, Drawer, Dropdown, Menu } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import "./Header.css";
import "../styles/AdminResponsive.css";
import Sidebar from "./Sidebar";

import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
const Header = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    document.body.classList.add("admin-responsive-page");
    return () => document.body.classList.remove("admin-responsive-page");
  }, []);
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    // ตรวจสอบ token หรือข้อมูลผู้ใช้จาก localStorage
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username"); // สมมติว่า username ถูกเก็บไว้
    if (token && username) {
      setUser(username);
    }
  }, []);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    localStorage.removeItem("LIFF_STORE:2007091295-9VRjXwVY:IDToken");
    localStorage.removeItem("LIFF_STORE:2007091295-9VRjXwVY:accessToken");
    localStorage.removeItem("LIFF_STORE:2007091295-9VRjXwVY:clientId");
    localStorage.removeItem("LIFF_STORE:2007091295-9VRjXwVY:context");
    localStorage.removeItem("LIFF_STORE:2007091295-9VRjXwVY:decodedIDToken");
    localStorage.removeItem("LIFF_STORE:2007091295-9VRjXwVY:loginTmp");
    setUser(null);
    navigate("/");
  };
  const menu = (
    <Menu>
      {/* <Menu.Item key="0">โปรไฟล์</Menu.Item>
      <Menu.Item key="1">ตั้งค่า</Menu.Item> */}
      <Menu.Item key="logout" onClick={handleLogout}>
        ออกจากระบบ
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <div className="dashboard-header">
        <div className="dashboard-header-leading">
          <Button
            className="dashboard-menu-button"
            icon={<MenuOutlined />}
            aria-label="เปิดเมนูแอดมิน"
            onClick={() => setMenuOpen(true)}
          />
          <h2 className="title">{title}</h2>
        </div>
        <div className="header-user">
          <Dropdown overlay={menu} trigger={["click"]}>
            <div className="user-info">
              <div className="user-details">
                <span className="user-name">{user}</span>
              </div>
            </div>
          </Dropdown>
        </div>
      </div>
      <Drawer
        title="เมนู"
        placement="left"
        width={260}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        styles={{ body: { padding: 0 } }}
        className="dashboard-mobile-drawer"
      >
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </Drawer>
    </>
  );
};
Header.propTypes = {
  title: PropTypes.string.isRequired,
};
export default Header;
