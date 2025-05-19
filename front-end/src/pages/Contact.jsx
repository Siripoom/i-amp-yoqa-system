import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Modal, Button, Space, message, Skeleton, Tag } from "antd";
import "../styles/Home.css";
import "../styles/Contact.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import { MasterImage } from "../services/imageService";
import { PlayCircleOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const Contact = () => {
  const [masterImages, setMasterImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchMasterImages();
  }, []);

  const fetchMasterImages = async () => {
    try {
      setLoading(true);
      const response = await MasterImage.getMasterImage();
      if (response.status === "success" && Array.isArray(response.data)) {
        setMasterImages(response.data);
      } else {
        message.error("Failed to fetch master images");
      }
    } catch (err) {
      message.error("Failed to fetch master images");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Open the video modal for a selected master
  const openVideoModal = (master) => {
    setSelectedMaster(master);
    setVideoModalVisible(true);
  };

  // Close the video modal
  const closeVideoModal = () => {
    setVideoModalVisible(false);
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
        <Title level={2} className="text-center text-purple-700 mb-2">
          Master
        </Title>
        <Paragraph className="text-center text-gray-600 mb-8">
          Meet our experienced yoga masters who will guide you on your yoga journey
        </Paragraph>

        {loading ? (
          <Row gutter={[24, 24]} justify="center">
            {[1, 2, 3].map((index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card className="master-skeleton">
                  <Skeleton active avatar={{ shape: "square", size: 200 }} paragraph={{ rows: 4 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : masterImages.length > 0 ? (
          <Row gutter={[24, 24]} justify="center">
            {masterImages.map((master, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card
                  hoverable
                  cover={
                    <div className="master-image-container">
                      <img 
                        alt={master.mastername || "Yoga Master"} 
                        src={master.image} 
                        className="master-image"
                      />
                      {master.video && (
                        <div 
                          className="video-indicator"
                          onClick={(e) => {
                            e.stopPropagation();
                            openVideoModal(master);
                          }}
                        >
                          <PlayCircleOutlined style={{ fontSize: '24px' }} />
                        </div>
                      )}
                    </div>
                  }
                  className="master-card"
                  style={{ backgroundColor: "#FFE2E5" }}
                  onClick={() => master.video && openVideoModal(master)}
                >
                  <div className="master-info">
                    <h3 className="master-name">
                      {master.mastername || "Yoga Master"}
                    </h3>
                    
                    {master.specialization && (
                      <div className="master-specialization">
                        <Tag color="pink">{master.specialization}</Tag>
                      </div>
                    )}
                    
                    {master.bio && (
                      <Paragraph
                        ellipsis={{ rows: 3, expandable: false }}
                        className="master-bio"
                      >
                        {master.bio}
                      </Paragraph>
                    )}
                    
                    {master.video && (
                      <Button 
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openVideoModal(master);
                        }}
                        className="watch-button"
                      >
                        Watch Introduction
                      </Button>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center text-gray-500">
            No master profiles available.
          </div>
        )}
      </div>

      {/* Video Modal */}
      <Modal
        title={selectedMaster?.mastername || "Master Introduction"}
        visible={videoModalVisible}
        onCancel={closeVideoModal}
        footer={null}
        width={800}
        centered
      >
        {selectedMaster?.video && (
          <div className="flex flex-col">
            <div className="video-container">
              <video
                controls
                autoPlay
                src={selectedMaster.video}
              />
            </div>
            
            <div className="master-details">
              {selectedMaster.bio && (
                <div className="mb-4">
                  <Title level={5}>Biography:</Title>
                  <Paragraph>{selectedMaster.bio}</Paragraph>
                </div>
              )}
              
              {selectedMaster.specialization && (
                <div>
                  <Title level={5}>Specialization:</Title>
                  <Tag color="pink" style={{ fontSize: '14px', padding: '4px 10px' }}>
                    {selectedMaster.specialization}
                  </Tag>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
};

export default Contact;