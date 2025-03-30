import { useEffect, useState } from "react";
import { Card, Row, Col, Typography } from "antd";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import { MasterImage } from "../services/imageService"; // Make sure to import the service

const { Title, Paragraph } = Typography;

const Contact = () => {
  const [masterImages, setMasterImages] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchMasterImages();
  }, []);

  const fetchMasterImages = async () => {
    try {
      const response = await MasterImage.getMasterImage();
      if (response.status === "success" && Array.isArray(response.data)) {
        setMasterImages(response.data); // Set the images from the 'data' field
      } else {
        message.error("Failed to fetch master images");
      }
    } catch (err) {
      message.error("Failed to fetch master images");
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b"
      style={{
        background:
          "linear-gradient(to bottom, #FEADB4 10%, #FFFFFF 56%, #B3A1DD 100%)",
      }}
    >
      <Navbar />
      <HeroSection />

      {/* Grid Layout สำหรับแสดงครูโยคะ */}
      <div className="container mx-auto px-4 py-10">
        <Title level={2} className="text-center text-purple-700">
          Master
        </Title>
        <Row gutter={[16, 16]} justify="center">
          {masterImages.map((instructor, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                hoverable
                cover={
                  <img alt={instructor.mastername} src={instructor.image} />
                }
                className="rounded-lg shadow-lg"
                style={{ backgroundColor: "#FFE2E5" }}
              >
                <Title level={4} className="text-center">
                  {instructor.mastername}
                </Title>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
