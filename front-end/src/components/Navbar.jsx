import { colors } from "../theme/tokens.js";
import { Button, Dropdown, Menu, message } from "antd";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { MenuOutlined, CloseOutlined, UserOutlined } from "@ant-design/icons";
import { brand } from "../config/brand.js";
import { performCompleteLogout } from "../utils/lineLogout";
const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // ตรวจสอบ token หรือข้อมูลผู้ใช้จาก localStorage
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username"); // สมมติว่า username ถูกเก็บไว้
    if (token && username) {
      setUser(username);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await performCompleteLogout(navigate, message);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback logout
      localStorage.clear();
      setUser(null);
      navigate("/");
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile">
        <Link to="/profile">Profile</Link>
      </Menu.Item>
      <Menu.Item key="logout" onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="sticky top-0 z-50 bg-background border-b border-border shadow-sm font-mali">
      <div className="container mx-auto px-4 lg:px-12 py-4 flex justify-between items-center">
        {/* Logo image */}

        <div>
          <Link to="/" className="flex items-center" aria-label={`${brand.name} home`}>
            <img
              src={brand.logoPath}
              alt={`${brand.name} logo`}
              className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-xl"
            />
          </Link>
        </div>

        {/* Menu Items for Large Screens */}
        <div className="hidden md:flex space-x-8">
          <NavLink
            to="/"
            className="wellness-nav-link text-text hover:text-primary font-medium">
            หน้าหลัก
          </NavLink>
          <NavLink
            to="/class"
            className="wellness-nav-link text-text hover:text-primary font-medium">
            คลาสโยคะ
          </NavLink>
          <NavLink
            to="/course"
            className="wellness-nav-link text-text hover:text-primary font-medium">
            โปรโมชั่น
          </NavLink>
          <NavLink
            to="/contact"
            className="wellness-nav-link text-text hover:text-primary font-medium">
            ครูผู้สอน
          </NavLink>
          <NavLink
            to="/booking"
            className="wellness-nav-link text-text hover:text-primary font-medium">
            จองคลาสฝึกโยคะ
          </NavLink>
        </div>

        {/* Hamburger Menu Icon */}
        <div className="md:hidden">
          <Button
            type="text"
            className="text-text"
            icon={isMobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </div>

        {/* Sign-In or User Dropdown */}
        <div className="hidden md:block">
          {user ? (
            <Dropdown overlay={userMenu} trigger={["click"]}>
              <Button
                className="bg-transparent border-none flex items-center space-x-2 text-lg font-bold text-primary"
                style={{
                  cursor: "pointer",
                  color: colors["primary"], // สีเข้มขึ้น
                  hover: "none", // ลบ hover effect
                }}
              >
                <span>{user}</span>
              </Button>
            </Dropdown>
          ) : (
            <Link to="/auth/signin">
              <Button
                type="primary"
                className="bg-primary text-white font-semibold px-4 rounded-2xl hover:bg-primary"
              >
                Sign-In
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-surface shadow-lg">
          <div className="flex flex-col items-center space-y-4 py-4">
            <Link
              to="/"
              className="wellness-nav-link text-text hover:text-primary font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              หน้าหลัก
            </Link>
            <Link
              to="/class"
              className="wellness-nav-link text-text hover:text-primary font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              คลาสโยคะ
            </Link>
            <Link
              to="/course"
              className="wellness-nav-link text-text hover:text-primary font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              โปรโมชั่น
            </Link>
            <Link
              to="/contact"
              className="wellness-nav-link text-text hover:text-primary font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ครูผู้สอน
            </Link>
            <Link
              to="/booking"
              className="wellness-nav-link text-text hover:text-primary font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              จองคลาสฝึกโยคะ
            </Link>
            {user ? (
              <Dropdown overlay={userMenu} trigger={["click"]}>
                <Button className="bg-white border-none flex items-center space-x-2 hover:text-primary">
                  <UserOutlined />
                  <span>{user}</span>
                </Button>
              </Dropdown>
            ) : (
              <Link to="/auth/signin">
                <Button
                  type="primary"
                  className="bg-primary text-white font-semibold px-4 rounded-2xl hover:bg-primary"
                >
                  Sign-In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
