import { Button, Typography, Radio } from "antd";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useState } from "react";
import { Link } from "react-router-dom";
import image from "../assets/images/imageC1.png";
const { Title, Text } = Typography;

const CourseDetail = () => {
  const [selectedSession, setSelectedSession] = useState(null);

  const handleSessionChange = (e) => {
    setSelectedSession(e.target.value);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "var(--color-background)",
      }}
    >
      <Navbar />
      <div className="container mx-auto py-12 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Section - Mockup Course Image */}
          <div className="relative">
            <div className=" h-auto flex items-center justify-center">
              <img
                src={image}
                alt="Yoga Hero"
                className="rounded-lg shadow-lg"
              />
            </div>

            <span className="absolute top-2 left-2 bg-primary text-white text-sm px-2 py-1 rounded">
              Pro Class
            </span>
          </div>

          {/* Right Section - Course Details */}
          <div>
            <Title level={3} className="text-text">
              MEDITATION YOGA (M)
            </Title>
            {/* <Text className="line-through text-secondary block">฿9,990.00</Text> */}
            {/* <Text className="text-text font-bold text-lg">฿4,990.00</Text> */}

            <Text className="block mt-4 text-text">
              โยคะสายปรับสมุดล สายสมาธิ คลายความเครียด ลดความกังวล กำหนดลมหายใจ
              ให้เวลาเรียนรู้ร่างกาย เหมาะกับผู้ฝึกใหม่ขึ้นไป
            </Text>

            {/* Instructor Information */}
            <div className="flex items-center mt-4">
              {/* <div className="bg-border w-12 h-12 rounded-full flex items-center justify-center">
                <span className="text-secondary text-xs">Avatar</span>
              </div> */}
              <div className="ml-4">
                {/* <Text className="block font-bold">Instructor Name</Text>
                <Text className="text-secondary text-sm">
                  Instructor Role and Organization
                </Text> */}
              </div>
            </div>

            {/* Session Selector with Radio Buttons */}
            {/* <div className="mt-6">
              <Text className="text-text font-medium">Choose Session:</Text>
              <div className="mt-2">
                <Radio.Group
                  onChange={handleSessionChange}
                  value={selectedSession}
                  className="flex flex-col"
                >
                  <Radio value={10}>10 Sessions</Radio>
                  <Radio value={20}>20 Sessions</Radio>
                  <Radio value={30}>30 Sessions</Radio>
                </Radio.Group>
              </div>
            </div> */}

            {/* Add to Cart Button */}
            <div className="mt-6">
              <Link to="/cart">
                <Button
                  type="primary"
                  className="bg-primary text-white px-6 rounded-lg hover:bg-warning"
                >
                  Add to cart
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CourseDetail;
