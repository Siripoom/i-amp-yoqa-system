import { Card, Row, Col, Typography } from "antd";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import { useEffect } from "react";

// ✅ Import รูปภาพแบบถูกต้อง
import t01 from "../assets/images/Kru iampyoqa-01_0.png";
import t02 from "../assets/images/Kru iampyoqa-02_0.png";
import t03 from "../assets/images/Kru iampyoqa-03_0.png";
import t04 from "../assets/images/Kru iampyoqa-04_0.png";
import t05 from "../assets/images/Kru iampyoqa-05_0.png";
import t06 from "../assets/images/Kru iampyoqa-06_0.png"; // เปลี่ยนชื่อไฟล์ให้ไม่ซ้ำ

const { Title, Paragraph } = Typography;

const instructors = [
  {
    name: "KRU.AMP",
    image: t01, // ✅ ไม่ต้องมี {}
  },
  {
    name: "KRU.PHU",
    image: t04,
  },
  {
    name: "KRU.KED",
    image: t02,
  },
  {
    name: "KRU.KUNG",
    image: t03,
  },
  {
    name: "KRU.NUCHY",
    image: t05,
  },
  {
    name: "KRU.OON", // ✅ แก้ชื่อไม่ให้ซ้ำ
    image: t06,
  },
];

const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          {instructors.map((instructor, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                hoverable
                cover={<img alt={instructor.name} src={instructor.image} />}
                className="rounded-lg shadow-lg"
                style={{ backgroundColor: "#FFE2E5" }}
              >
                <Title level={4} className="text-center">
                  {instructor.name}
                </Title>
                <Paragraph className="text-center">
                  {instructor.description}
                </Paragraph>
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
