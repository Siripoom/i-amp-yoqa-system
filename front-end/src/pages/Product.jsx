import { Button, Card } from "antd";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";

const Product = () => {
  return (
    <div
      className="min-h-screen bg-gradient-to-b"
      style={{
        background:
          "var(--color-background)",
      }}
    >
      <Navbar />
      {/* Hero Section */}
      <HeroSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Product;
