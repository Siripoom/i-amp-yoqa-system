import { Layout, Avatar, Dropdown, Menu } from "antd";
import { DownOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";
import "./Header.css";

const { Header } = Layout;

const userMenu = (
  <Menu>
    <Menu.Item key="profile">Profile</Menu.Item>
    <Menu.Item key="settings">Settings</Menu.Item>
    <Menu.Item key="logout">Logout</Menu.Item>
  </Menu>
);

const CustomHeader = ({ title }) => {
  return (
    <Header className="custom-header">
      <div className="header-title">{title}</div>
      <Dropdown overlay={userMenu} trigger={["click"]}>
        <div className="profile-section">
          <Avatar
            src="https://i.pravatar.cc/300"
            size="large"
            className="avatar"
          />
          <div className="username-info">
            <span className="username">Musfiq</span>
            <span className="role">Admin</span>
          </div>
          <DownOutlined />
        </div>
      </Dropdown>
    </Header>
  );
};

CustomHeader.propTypes = {
  title: PropTypes.string.isRequired,
};

export default CustomHeader;
