import React from "react";
import { Row, Col } from "antd";
import heroImage from "../assets/images/27615.jpg";

const HeroSection = () => {
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
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default HeroSection;
