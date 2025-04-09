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
import c06 from "../assets/images/BALANCE YOGA (B).jpg";
import c07 from "../assets/images/WHEEL YOGA (W).jpg";

const { Title, Paragraph } = Typography;

const Class = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const yogaClasses = [
    {
      title: "RELAXING YOGA (R)",
      image: c01,
      description:
        "โยคะสายรีแล็กซ์ ผ่อนคลาย เบาสบาย สายชิวไปเรื่อยๆ เหมาะกับผู้ฝึกใหม่ขึ้นไป ผู้ฝึกเบาๆคุณแม่หลังคลอดและเด็ก",
    },
    {
      title: "POWER FLOW YOGA (P)",
      image: c02,
      description:
        "โยคะสายเบิร์น พัฒนาความแข็งแรง สร้างความแข็งแรง กระชับกล้ามเนื้อเหมาะกับผู้ฝึกระดับกลางขึ้นไป ผู้ฝึกที่อยากกระชับสัดส่วน",
    },
    {
      title: "HATHA FLOW YOGA (H)",
      image: c03,
      description:
        "หฐะโยคะ คลาสโยคะทั่วไป ยืดเหยียดร่างกาย เน้นจัดการจัดปรับร่างกาย ไปตามลมหายใจเหมาะกับผู้ฝึกใหม่ขึ้นไป",
    },
    {
      title: "OFFICE SYNDROME FOR YOGA (O)",
      image: c04,
      description:
        "โยคะสายบำบัด ลดอาการออฟฟิศซินโดรม ปวดคอ บ่า ไหล่เหมาะกับผู้ฝึกใหม่ขึ้นไป ผู้ฝึกสายหน้าคอม",
    },
    {
      title: "FIT FLOW YOGA (F)",
      image: c05,
      description:
        "โยคะสร้างความแข็งแรง สร้างกล้ามเนื้อหัวไหล่แข็งแรง เคลื่อนไหวรวดเร็ว Asana ผสม Cardio นิดๆเหมาะกับผู้ฝึกที่ฝึกมาอย่างต่อเนื่องเป็นสม่ำเสมอ ผู้ฝึกที่เข้าท่าได้อย่างคล้องตัว เน้นเข้าท่าไวเปลี่ยนท่าเร็ว ผู้ฝึกไม่เน้นค้างท่านาน เรียกเหงื่อ",
    },
    {
      title: "BALANCE YOGA (B)",
      image: c06,
      description:
        "โยคะสายบาลานซ์ ฝึการทรงตัว ฝึกสมาธิ สร้างความแข็งแรงของขาเหมาะกับผู้ฝึกระดับกลางขึ้นไป ผู้ที่อยากพัฒนาการทรงตัวด้วยการยืนขาเดียว",
    },
    {
      title: "WHEEL YOGA (W)",
      image: c07,
      description:
        "โยคะวีล โยคะวงล้อ ยืดหยุ่นกล้ามเนื้อหลังได้ดี หัวไหล่ยืดหยุ่นได้ง่ายขึ้น ช่วยฝึกในการเข้าท่า Inversion ได้ดีขึ้นเหมาะกับผู้ฝึกที่มีอุปกรณ์โยคะวีล",
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

      <div className="container mx-auto px-4 py-10">
        <Title level={2} className="text-center text-purple-700 mb-8">
          CLASS YOGA
        </Title>

        <Row gutter={[16, 24]} justify="center">
          {yogaClasses.map((yogaClass, index) => (
            <Col xs={24} sm={12} md={8} lg={8} xl={8} key={index}>
              <Card
                hoverable
                cover={<img alt={yogaClass.title} src={yogaClass.image} />}
                style={{
                  borderRadius: "15px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  height: "100%",
                }}
                bodyStyle={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
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
