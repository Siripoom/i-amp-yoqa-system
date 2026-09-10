import { Link, useNavigate } from "react-router-dom";
import { brand } from "../config/brand.js";

const Footer = () => {
  const navigate = useNavigate();

  // ฟังก์ชันสำหรับการจัดการการคลิก
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${brand.email}`;
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:${brand.phoneHref}`;
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
    <footer className="bg-primary-dark text-white py-14">
      <div className="container mx-auto px-4">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="brand">
            <div className="cursor-pointer transition-transform duration-300 hover:scale-105">
              <Link to="/" aria-label={`${brand.name} home`}>
                <img
                  src={brand.logoPath}
                  alt={`${brand.name} logo`}
                  className="w-36 h-36 object-contain rounded-2xl"
                />
              </Link>
            </div>
            <p className="text-surface text-sm mt-4">
              @ 2024 - {brand.name} - Designed & Developed by Siripoom
            </p>
            <Link
              to="https://dbdregistered.dbd.go.th/api/public/shopinfo?param=6A693ADD3AD1C7457F18C78598EDAD1C1AF6EFDB5823CFE666A39F9441048B67"
              target="_blank"
              className="dbd-link-container"
              rel="noopener noreferrer"
            >
              <img
                src="https://dbdregistered.dbd.go.th/api/public/banner?param=6A693ADD3AD1C7457F18C78598EDAD1C1AF6EFDB5823CFE666A39F9441048B67"
                alt="DBD Registered Shop Information"
                className="dbd-banner-image"
                loading="lazy"
              />
            </Link>
          </div>

          {/* Support Section */}
          <div className="support">
            <h3 className="text-lg font-semibold mb-3">Support</h3>
            <div className="space-y-2">
              <p
                className="text-sm hover:text-accent cursor-pointer transition-colors duration-300"
                onClick={handleEmailClick}
                title={`Send email to ${brand.email}`}
              >
                📧 {brand.email}
              </p>
              <p
                className="text-sm hover:text-accent cursor-pointer transition-colors duration-300"
                onClick={handlePhoneClick}
                title={`Call ${brand.phoneDisplay}`}
              >
                📞 {brand.phoneDisplay}
              </p>
              <a
                href={brand.lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm hover:text-success transition-colors duration-300"
                title="Contact via LINE"
              >
                💬 LINE: {brand.lineId}
              </a>
              <p className="text-sm text-surface leading-relaxed">
                📍 {brand.address}
              </p>
            </div>
          </div>

          {/* Account Section */}
          <div className="account">
            <h3 className="text-lg font-semibold mb-3">Account</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={handleMyAccount}
                  className="text-surface hover:text-surface transition-colors duration-300 text-left w-full"
                >
                  My Account
                </button>
              </li>
              <li>
                <button
                  onClick={handleLogin}
                  className="text-surface hover:text-surface transition-colors duration-300 text-left w-full"
                >
                  Login / Register
                </button>
              </li>
              <li>
                <button
                  onClick={handleCart}
                  className="text-surface hover:text-surface transition-colors duration-300 text-left w-full"
                >
                  My Orders
                </button>
              </li>
              <li>
                <Link
                  to="/course"
                  className="text-surface hover:text-surface transition-colors duration-300 block"
                >
                  Promotion
                </Link>
              </li>
              <li>
                <Link
                  to="/class"
                  className="text-surface hover:text-surface transition-colors duration-300 block"
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
                  className="text-surface hover:text-surface transition-colors duration-300 block"
                >
                  Master
                </Link>
              </li>
              <li>
                <Link
                  to="https://forms.gle/uoTsFBoRRXYw9mL66"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-surface hover:text-surface transition-colors duration-300 block"
                >
                  Work with {brand.name}
                </Link>
              </li>
              <li>
                <Link
                  to="/booking"
                  className="text-surface hover:text-surface transition-colors duration-300 block"
                >
                  Book a Class
                </Link>
              </li>
              <li>
                <button
                  onClick={handleScrollToTop}
                  className="text-surface hover:text-surface transition-colors duration-300 text-left w-full"
                >
                  ↑ Back to Top
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-surface text-sm">
            © 2024 {brand.name}. All rights reserved. |
            <Link
              to="/class"
              className="hover:text-accent transition-colors duration-300 ml-1"
            >
              Yoga Classes
            </Link>{" "}
            |
            <Link
              to="/course"
              className="hover:text-accent transition-colors duration-300 ml-1"
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
