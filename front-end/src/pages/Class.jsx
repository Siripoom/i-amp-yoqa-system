import { Card, Row, Col, Typography } from "antd";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import { useEffect } from "react";

// ✅ Import รูปภาพแบบถูกต้อง
import c01 from "../assets/images/RelaxingYoqa(R).jpg";
import c02 from "../assets/images/POWER FLOW YOGA (P).jpg";
import c03 from "../assets/images/HATHA FLOW YOGA (H).jpg";
import c04 from "../assets/images/OFFICE SYNDROME FOR YOGA (O).jpg";
import c05 from "../assets/images/FIT FLOW YOGA (F).jpg";
import c06 from "../assets/images/BALANCE YOGA (B).jpg"; // เปลี่ยนชื่อไฟล์ให้ไม่ซ้ำ
import c07 from "../assets/images/WHEEL YOGA (W).jpg"; // เปลี่ยนชื่อไฟล์ให้ไม่ซ้ำ

const { Title, Paragraph } = Typography;

const Class = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const yogaClasses = [
    {
      title: "Relaxing Yoga",
      image: c01,
      description:
        "A calming and restorative yoga session to help you relax and relieve stress.",
    },
    {
      title: "Power Flow Yoga",
      image: c02,
      description:
        "An energetic flow designed to build strength and endurance through dynamic movements.",
    },
    {
      title: "Hatha Flow Yoga",
      image: c03,
      description:
        "A balanced practice that combines breath, movement, and mindfulness for a grounded experience.",
    },
    {
      title: "Office Syndrome Yoga",
      image: c04,
      description:
        "A class designed to alleviate common office-related tension and improve posture.",
    },
    {
      title: "Fit Flow Yoga",
      image: c05,
      description:
        "A fun and challenging practice combining strength, flexibility, and flow.",
    },
    {
      title: "Balance Yoga",
      image: c06,
      description:
        "Focus on improving balance, coordination, and body alignment in this gentle practice.",
    },
    {
      title: "Wheel Yoga",
      image: c07,
      description:
        "An advanced practice using the yoga wheel to enhance flexibility and strength.",
    },
  ];

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
        <Title level={2} className="text-center text-purple-700 mb-8">
          CLASS SCHEDULE
        </Title>

        <Row gutter={[16, 16]} justify="center">
          {yogaClasses.map((yogaClass, index) => (
            <Col span={8} key={index}>
              <Card
                hoverable
                cover={<img alt={yogaClass.title} src={yogaClass.image} />}
                style={{
                  borderRadius: "15px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <Title level={4} className="text-center text-purple-600">
                  {yogaClass.title}
                </Title>
                <Paragraph className="text-center text-gray-600">
                  {yogaClass.description}
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

export default Class;
