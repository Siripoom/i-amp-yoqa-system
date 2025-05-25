import { Button, Dropdown, Menuม, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { MenuOutlined, CloseOutlined, UserOutlined } from "@ant-design/icons";
import logo from "../assets/images/logo.png";
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
    <div className="sticky top-0 z-50 shadow-sm font-fredoka">
      <div className="container mx-auto px-4 lg:px-12 py-4 flex justify-between items-center">
        {/* Logo image */}

        <div className="text-2xl font-bold text-blue-900">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="Logo" className="h-12" />
            <span>IAMPYOQA</span>
          </Link>
        </div>

        {/* Menu Items for Large Screens */}
        <div className="hidden md:flex space-x-8">
          <Link
            to="/"
            className="text-gray-700 hover:text-pink-500 font-medium"
          >
            หน้าหลัก
          </Link>
          <Link
            to="/class"
            className="text-gray-700 hover:text-pink-500 font-medium"
          >
            คลาสโยคะ
          </Link>
          <Link
            to="/course"
            className="text-gray-700 hover:text-pink-500 font-medium"
          >
            โปรโมชั่น
          </Link>
          <Link
            to="/contact"
            className="text-gray-700 hover:text-pink-500 font-medium"
          >
            ครูผู้สอน
          </Link>
          <Link
            to="/booking"
            className="text-gray-700 hover:text-pink-500 font-medium"
          >
            จองคลาสฝึกโยคะ
          </Link>
        </div>

        {/* Hamburger Menu Icon */}
        <div className="md:hidden">
          <Button
            type="text"
            className="text-gray-700"
            icon={isMobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </div>

        {/* Sign-In or User Dropdown */}
        <div className="hidden md:block">
          {user ? (
            <Dropdown overlay={userMenu} trigger={["click"]}>
              <Button
                className="bg-transparent border-none flex items-center space-x-2 text-lg font-bold text-blue-900"
                style={{
                  cursor: "pointer",
                  color: "#1E3A8A", // สีเข้มขึ้น
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
                className="bg-gradient-to-r from-pink-500 to-red-400 text-white font-semibold px-4 rounded-2xl hover:bg-pink-400"
              >
                Sign-In
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-pink-50 shadow-lg">
          <div className="flex flex-col items-center space-y-4 py-4">
            <Link
              to="/"
              className="text-gray-700 hover:text-pink-500 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              หน้าหลัก
            </Link>
            <Link
              to="/class"
              className="text-gray-700 hover:text-pink-500 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              คลาสโยคะ
            </Link>
            <Link
              to="/course"
              className="text-gray-700 hover:text-pink-500 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              โปรโมชั่น
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-pink-500 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ครูผู้สอน
            </Link>
            <Link
              to="/booking"
              className="text-gray-700 hover:text-pink-500 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              จองคลาสฝึกโยคะ
            </Link>
            {user ? (
              <Dropdown overlay={userMenu} trigger={["click"]}>
                <Button className="bg-white border-none flex items-center space-x-2 hover:text-pink-500">
                  <UserOutlined />
                  <span>{user}</span>
                </Button>
              </Dropdown>
            ) : (
              <Link to="/auth/signin">
                <Button
                  type="primary"
                  className="bg-gradient-to-r from-pink-500 to-red-400 text-white font-semibold px-4 rounded-2xl hover:bg-pink-400"
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
