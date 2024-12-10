import { Button } from "antd";
import { Link } from "react-router-dom";
import { useState } from "react";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50  shadow-sm font-fredoka">
      <div className="container mx-auto px-4 lg:px-12 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="text-2xl font-bold text-blue-900">
          <Link to="/">IAMPYOQA</Link>
        </div>

        {/* Menu Items for Large Screens */}
        <div className="hidden md:flex space-x-8">
          <Link
            to="/"
            className="text-gray-700 hover:text-pink-500 font-medium"
          >
            HOME
          </Link>
          <Link
            to="/course"
            className="text-gray-700 hover:text-pink-500 font-medium"
          >
            COURSE
          </Link>
          {/* <Link
            to="/product"
            className="text-gray-700 hover:text-pink-500 font-medium"
          >
            PRODUCT
          </Link> */}
          <Link
            to="/contact"
            className="text-gray-700 hover:text-pink-500 font-medium"
          >
            CONTACT
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

        {/* Sign-In Button */}
        <div className="hidden md:block">
          <Button
            type="primary"
            className="bg-gradient-to-r from-pink-500 to-red-400 text-white font-semibold px-4 rounded-2xl hover:bg-pink-400"
          >
            Sign-In
          </Button>
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
              HOME
            </Link>
            <Link
              to="/course"
              className="text-gray-700 hover:text-pink-500 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              COURSE
            </Link>
            <Link
              to="/product"
              className="text-gray-700 hover:text-pink-500 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              PRODUCT
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-pink-500 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              CONTACT
            </Link>
            <Button
              type="primary"
              className="bg-gradient-to-r from-pink-500 to-red-400 text-white font-semibold px-4 rounded-2xl hover:bg-pink-400"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Sign-In
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
