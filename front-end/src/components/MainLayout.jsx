import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import CustomHeader from "./Header";
import PropTypes from "prop-types";
import "./MainLayout.css";
const { Content } = Layout;

const MainLayout = ({ title }) => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout className="site-layout">
        <CustomHeader title={title} />
        <Content style={{ padding: "24px", backgroundColor: "#f4f6f8" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

// Add prop validation
MainLayout.propTypes = {
  title: PropTypes.string.isRequired,
};

export default MainLayout;
