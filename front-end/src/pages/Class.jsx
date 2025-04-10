import { Card, Row, Col, Typography, message } from "antd";
import "../styles/Home.css";
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
                          aspectRatio: "3/4",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  }
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
                    {yogaClass.classname}
                  </Title>
                  <Paragraph className="text-center text-gray-600">
                    {yogaClass.description}
                  </Paragraph>
                </Card>
              </Col>
            ))
          )}
        </Row>
      </div>

      <Footer />
    </div>
  );
};

export default Class;
