import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Modal, Button, Space } from "antd";
import {
  PlayCircleOutlined,
  UserOutlined,
  BookOutlined,
} from "@ant-design/icons";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { MasterImage } from "../services/imageService";

const { Title, Paragraph, Text } = Typography;

const Contact = () => {
  const [masterImages, setMasterImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedMaster, setSelectedMaster] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchMasterImages();
  }, []);

  const fetchMasterImages = async () => {
    try {
      const response = await MasterImage.getMasterImage();
      if (response.status === "success" && Array.isArray(response.data)) {
        setMasterImages(response.data);
      } else {
        console.error("Failed to fetch master images");
      }
    } catch (err) {
      console.error("Failed to fetch master images", err);
    } finally {
      setLoading(false);
    }
  };

  // YouTube URL แปลงเป็น embed URL
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;

    let videoId = "";

    // Match YouTube URL patterns
    const regularMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (regularMatch) videoId = regularMatch[1];

    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) videoId = shortMatch[1];

    const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
    if (embedMatch) videoId = embedMatch[1];

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return null;
  };

  // Show video modal
  const showVideoModal = (master) => {
    const embedUrl = getYoutubeEmbedUrl(master.videoUrl);
    if (embedUrl) {
      setSelectedVideo(embedUrl);
      setSelectedMaster(master);
      setVideoModalVisible(true);
    }
  };

  // Close video modal
  const closeVideoModal = () => {
    setVideoModalVisible(false);
    setSelectedVideo(null);
    setSelectedMaster(null);
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

      {/* Grid Layout สำหรับแสดงครูโยคะ */}
      <div className="container mx-auto px-4 py-10">
        <Title level={2} className="text-center text-purple-700 mb-8">
          Meet Our Yoga Masters
        </Title>

        {loading ? (
          <div className="text-center text-purple-500 font-semibold">
            Loading masters...
          </div>
        ) : (
          <Row gutter={[24, 24]} justify="center">
            {masterImages.map((instructor, index) => (
              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                <Card
                  hoverable
                  className="rounded-lg shadow-lg h-full"
                  style={{
                    backgroundColor: "#FFE2E5",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  cover={
                    <div className="relative">
                      <img
                        alt={instructor.mastername}
                        src={instructor.image}
                        style={{
                          height: "350px",
                          objectFit: "fit",
                          width: "100%",
                        }}
                        loading="lazy"
                      />
                      {/* Video overlay button */}
                      {instructor.videoUrl && (
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                          onClick={() => showVideoModal(instructor)}
                        >
                          <PlayCircleOutlined
                            style={{
                              fontSize: "48px",
                              color: "white",
                              backgroundColor: "rgba(0,0,0,0.7)",
                              borderRadius: "50%",
                              padding: "10px",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  }
                  bodyStyle={{
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Title
                      level={4}
                      className="text-center text-purple-700 mb-2"
                    >
                      <UserOutlined className="mr-2" />
                      {instructor.mastername}
                    </Title>
                    {/* Description */}
                    {instructor.description && (
                      <div className="text-start text-gray-600 mb-3">
                        {instructor.description.split(',').map((item, index) => (
                          <div key={index} className="mb-1">
                            <Text strong className="text-purple-700">
                              • {item.trim()}
                            </Text>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Specialization */}
                    {instructor.specialization && (
                      <div className="text-center mb-3">
                        <Text strong className="text-pink-600">
                          <BookOutlined className="mr-1" />
                          {instructor.specialization}
                        </Text>
                      </div>
                    )}

                    {/* Biography */}
                    {instructor.bio && (
                      <Paragraph
                        className="text-center text-gray-600 text-sm"
                        ellipsis={{ rows: 3, expandable: false }}
                      >
                        {instructor.bio}
                      </Paragraph>
                    )}
                  </div>

                  {/* Video button */}
                  {instructor.videoUrl && (
                    <div className="text-center mt-3">
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() => showVideoModal(instructor)}
                        className="bg-gradient-to-r from-pink-500 to-red-400 border-none"
                      >
                        Watch Video
                      </Button>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {!loading && masterImages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Title level={4} className="text-gray-400">
              No masters available at the moment
            </Title>
            <Text>Please check back later for our yoga masters.</Text>
          </div>
        )}
      </div>

      {/* YouTube Video Modal */}
      <Modal
        title={
          <Space>
            <PlayCircleOutlined />
            <span>{selectedMaster?.mastername} - Introduction Video</span>
          </Space>
        }
        visible={videoModalVisible}
        onCancel={closeVideoModal}
        footer={null}
        width={800}
        centered
        bodyStyle={{ padding: "0" }}
      >
        {selectedVideo && (
          <div
            style={{
              position: "relative",
              paddingBottom: "56.25%" /* 16:9 Aspect Ratio */,
              height: 0,
              overflow: "hidden",
              maxWidth: "100%",
            }}
          >
            <iframe
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              src={selectedVideo}
              title={`${selectedMaster?.mastername} Introduction Video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        )}

        {/* Master info below video */}
        {selectedMaster && (
          <div style={{ padding: "16px" }}>
            {selectedMaster.specialization && (
              <div className="mb-2">
                <Text strong>Specialization: </Text>
                <Text>{selectedMaster.specialization}</Text>
              </div>
            )}
            {selectedMaster.bio && (
              <div>
                <Text strong>About: </Text>
                <Text>{selectedMaster.bio}</Text>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
};

export default Contact;
