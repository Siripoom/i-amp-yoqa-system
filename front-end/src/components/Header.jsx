import { Avatar, Dropdown, Menu } from "antd";
import "./Header.css";
import person from "../assets/person_mockup.jpg";
import PropTypes from "prop-types";
const Header = ({ title }) => {
  const menu = (
    <Menu>
      <Menu.Item key="0">Profile</Menu.Item>
      <Menu.Item key="1">Settings</Menu.Item>
      <Menu.Item key="2">Logout</Menu.Item>
    </Menu>
  );

  return (
    <div className="dashboard-header">
      <h2 className="title">{title}</h2>
      <div className="header-user">
        <Dropdown overlay={menu} trigger={["click"]}>
          <div className="user-info">
            <Avatar src={person} alt="User Avatar" />
            <div className="user-details">
              <span className="user-name">IAMP</span>
              <span className="user-role">Admin</span>
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
