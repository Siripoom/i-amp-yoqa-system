import { Space } from "antd";
import { FacebookOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  // ฟังก์ชันสำหรับการจัดการการคลิก
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEmailClick = () => {
    window.location.href = "mailto:iampyoqa@gmail.com";
  };

  const handlePhoneClick = () => {
    window.location.href = "tel:+66991636169";
  };

  const handleLogin = () => {
    const token = localStorage.getItem("token");
    if (token) {
      // ถ้า login แล้วไปหน้า profile
      navigate("/profile");
    } else {
      // ถ้ายัง login ไปหน้า signin
      navigate("/auth/signin");
    }
  };

  const handleMyAccount = () => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/profile");
    } else {
      navigate("/auth/signin");
    }
  };

  const handleCart = () => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/my-orders"); // หรือ "/cart" ถ้ามีหน้า cart
    } else {
      navigate("/auth/signin");
    }
  };

  return (
    <footer className="bg-gray-800 text-white py-14">
      <div className="container mx-auto px-4">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="brand">
            <h2 className="text-2xl font-bold cursor-pointer hover:text-pink-300 transition-colors duration-300">
              <Link to="/" className="text-white hover:text-pink-300">
                IAMPYOQA
              </Link>
            </h2>
            <div className="social-icons mt-4 flex space-x-4">
              <a
                href="https://www.facebook.com/iampyoqa"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform duration-300"
              >
                <FacebookOutlined className="text-white text-xl hover:text-blue-400 transition-colors duration-300" />
              </a>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              @ 2024 - IAMPYOQA - Designed & Developed by Siripoom
            </p>
          </div>

          {/* Support Section */}
          <div className="support">
            <h3 className="text-lg font-semibold mb-3">Support</h3>
            <div className="space-y-2">
              <p
                className="text-sm hover:text-pink-300 cursor-pointer transition-colors duration-300"
                onClick={handleEmailClick}
                title="Send email to iampyoqa@gmail.com"
              >
                📧 iampyoqa@gmail.com
              </p>
              <p
                className="text-sm hover:text-pink-300 cursor-pointer transition-colors duration-300"
                onClick={handlePhoneClick}
                title="Call 099-1636169"
              >
                📞 099-1636169
              </p>
              <a
                href="https://line.me/R/ti/p/@iampyoqa"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm hover:text-green-400 transition-colors duration-300"
                title="Contact via LINE"
              >
                💬 LINE: @iampyoqa
              </a>
            </div>
          </div>

          {/* Account Section */}
          <div className="account">
            <h3 className="text-lg font-semibold mb-3">Account</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={handleMyAccount}
                  className="text-gray-300 hover:text-gray-100 transition-colors duration-300 text-left w-full"
                >
                  My Account
                </button>
              </li>
              <li>
                <button
                  onClick={handleLogin}
                  className="text-gray-300 hover:text-gray-100 transition-colors duration-300 text-left w-full"
                >
                  Login / Register
                </button>
              </li>
              <li>
                <button
                  onClick={handleCart}
                  className="text-gray-300 hover:text-gray-100 transition-colors duration-300 text-left w-full"
                >
                  My Orders
                </button>
              </li>
              <li>
                <Link
                  to="/course"
                  className="text-gray-300 hover:text-gray-100 transition-colors duration-300 block"
                >
                  Promotion
                </Link>
              </li>
              <li>
                <Link
                  to="/class"
                  className="text-gray-300 hover:text-gray-100 transition-colors duration-300 block"
                >
                  Course
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Link Section */}
          <div className="quick-link">
            <h3 className="text-lg font-semibold mb-3">Quick Link</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/contact"
                  className="text-gray-300 hover:text-gray-100 transition-colors duration-300 block"
                >
                  Master
                </Link>
              </li>
              <li>
                <Link
                  to="https://forms.gle/uoTsFBoRRXYw9mL66"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-gray-100 transition-colors duration-300 block"
                >
                  Work with IAMPYOQA
                </Link>
              </li>
              <li>
                <Link
                  to="/booking"
                  className="text-gray-300 hover:text-gray-100 transition-colors duration-300 block"
                >
                  Book a Class
                </Link>
              </li>
              <li>
                <button
                  onClick={handleScrollToTop}
                  className="text-gray-300 hover:text-gray-100 transition-colors duration-300 text-left w-full"
                >
                  ↑ Back to Top
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 IAMPYOQA. All rights reserved. |
            <Link
              to="/class"
              className="hover:text-pink-300 transition-colors duration-300 ml-1"
            >
              Yoga Classes
            </Link>{" "}
            |
            <Link
              to="/course"
              className="hover:text-pink-300 transition-colors duration-300 ml-1"
            >
              Promotions
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
