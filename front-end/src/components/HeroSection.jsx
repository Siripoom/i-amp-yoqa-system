import { useEffect, useState } from "react";
import { Row, Col } from "antd";

import { HeroImage } from "../services/imageService";
const HeroSection = () => {
  const [heroImage, setHeroImage] = useState(""); // Default image
  useEffect(() => {
    const fetchHeroImage = async () => {
      try {
        const response = await HeroImage.getHeroImage();

        setHeroImage(response.data[0].image); // Update state with the fetched image
      } catch (error) {
        console.error("Error fetching hero image:", error);
      }
    };
    fetchHeroImage();
  }, []);
  return (
    <div className="hero-section py-12 flex justify-center items-center">
      <Row justify="center" align="middle" className="w-full">
        {/* Full-Centered Image */}
        <Col xs={24} className="flex justify-center">
          <div className="w-3/4 md:w-1/2 h-auto">
            <img
              src={heroImage}
              alt="Yoga Hero"
              className="rounded-lg shadow-lg object-cover"
              loading="lazy"
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default HeroSection;
