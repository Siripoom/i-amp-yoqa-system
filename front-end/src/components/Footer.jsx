import { Space } from "antd";
import {
  FacebookOutlined,
  LineOutlined,
  InstagramOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";
// import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="brand">
            <h2 className="text-2xl font-bold">IAMPYOQA</h2>
            <div className="social-icons mt-4 flex space-x-4">
              <a
                href="https://www.facebook.com/iampyoqa"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FacebookOutlined className="text-white text-xl hover:text-gray-400" />
              </a>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              @ 2024 - IAMPYOQA - Designed & Developed by Siripoom
            </p>
          </div>

          {/* Support Section */}
          <div className="support">
            <h3 className="text-lg font-semibold">Support</h3>
            <p className="text-sm">imapyoqa@gmail.com</p>
            <p className="text-sm">099-16361699</p>
            <a
              href="https://line.me/R/ti/p/@iampyoqa"
              target="_blank"
              rel="noopener noreferrer"
            >
              <p className="text-sm">LINE: @iampyoqa</p>
            </a>
          </div>

          {/* Account Section */}
          <div className="account">
            <h3 className="text-lg font-semibold">Account</h3>
            <ul className="space-y-2 mt-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-gray-100">
                  My Account
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-gray-100">
                  Login / Register
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-gray-100">
                  Cart
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-gray-100">
                  Product
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-gray-100">
                  Course
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Link Section */}
          <div className="quick-link">
            <h3 className="text-lg font-semibold">Quick Link</h3>
            <ul className="space-y-2 mt-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-gray-100">
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="https://forms.gle/eUtnCpHBrhGL9HE59"
                  target="blank"
                  className="text-gray-300 hover:text-gray-100"
                >
                  Work with IAMPYOQA
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
