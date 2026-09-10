import { Card, Row, Col, Typography, message } from "antd";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { ImageCatalog } from "../services/imageService";

const { Title, Paragraph } = Typography;

const Class = () => {
  const [yogaClasses, setYogaClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchYogaClasses();
  }, []);

  const fetchYogaClasses = async () => {
    try {
      setLoading(true);
      const response = await ImageCatalog.getImageCatalog();
      // Access the array from the data property
      if (response && response.data) {
        setYogaClasses(response.data);
      } else {
        throw new Error("Invalid response structure");
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching yoga classes:", error);
      message.error("Failed to load yoga classes. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Background wrapper ที่ครอบคลุมทั้งหน้าจอ */}
      <div
        className="flex-1"
        style={{
          background:
            "var(--color-background)",
          minHeight: "100vh", // ให้แน่ใจว่าสูงเต็มหน้าจอ
        }}
      >
        <Navbar />

        {/* Main content area */}
        <div className="flex-1 pb-16">
          {" "}
          {/* เพิ่ม padding-bottom เพื่อไม่ให้ติด footer */}
          <div className="container mx-auto px-4 py-10">
            <Title level={2} className="text-center text-primary mb-8">
              CLASS YOGA
            </Title>

            <Row gutter={[16, 24]} justify="center">
              {loading ? (
                <Col span={24} className="text-center py-12">
                  <div className="loading">Loading...</div>
                </Col>
              ) : (
                yogaClasses.map((yogaClass, index) => (
                  <Col
                    xs={24}
                    sm={12}
                    md={8}
                    lg={8}
                    xl={8}
                    key={yogaClass._id || index}
                  >
                    <Card
                      hoverable
                      cover={
                        <div style={{ overflow: "hidden", width: "100%" }}>
                          <img
                            alt={yogaClass.classname}
                            src={yogaClass.image}
                            style={{
                              width: "100%",
                              aspectRatio: "4/4",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      }
                      style={{
                        borderRadius: "15px",
                        boxShadow: "0 4px 8px rgba(73,47,42,0.1)",
                        height: "100%",
                      }}
                      bodyStyle={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      <Title level={4} className="text-center text-primary">
                        {yogaClass.classname}
                      </Title>
                      <Paragraph className="text-center text-secondary">
                        {yogaClass.description}
                      </Paragraph>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
          </div>
        </div>
      </div>

      {/* Footer อยู่ด้านล่างสุด */}
      <Footer />
    </div>
  );
};

export default Class;
