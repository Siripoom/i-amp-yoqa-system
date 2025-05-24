import { Avatar, Dropdown, Menu } from "antd";
import "./Header.css";
import person from "../assets/person_mockup.jpg";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
const Header = ({ title }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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
      {/* <Menu.Item key="0">Profile</Menu.Item>
      <Menu.Item key="1">Settings</Menu.Item> */}
      <Menu.Item key="logout" onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="dashboard-header">
      <h2 className="title">{title}</h2>
      <div className="header-user">
        <Dropdown overlay={menu} trigger={["click"]}>
          <div className="user-info">
            {/* <Avatar src={person} alt="User Avatar" /> */}
            <div className="user-details">
              <span className="user-name">{user}</span>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};
Header.propTypes = {
  title: PropTypes.string.isRequired,
};
export default Header;
