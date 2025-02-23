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
          "linear-gradient(to bottom, #FEADB4 10%, #FFFFFF 56%, #B3A1DD 100%)",
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

            <span className="absolute top-2 left-2 bg-pink-500 text-white text-sm px-2 py-1 rounded">
              Pro Class
            </span>
          </div>

          {/* Right Section - Course Details */}
          <div>
            <Title level={3} className="text-gray-900">
              MEDITATION YOGA (M)
            </Title>
            {/* <Text className="line-through text-gray-500 block">฿9,990.00</Text> */}
            {/* <Text className="text-gray-900 font-bold text-lg">฿4,990.00</Text> */}

            <Text className="block mt-4 text-gray-700">
              โยคะสายปรับสมุดล สายสมาธิ คลายความเครียด ลดความกังวล กำหนดลมหายใจ
              ให้เวลาเรียนรู้ร่างกาย เหมาะกับผู้ฝึกใหม่ขึ้นไป
            </Text>

            {/* Instructor Information */}
            <div className="flex items-center mt-4">
              {/* <div className="bg-gray-300 w-12 h-12 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-xs">Avatar</span>
              </div> */}
              <div className="ml-4">
                {/* <Text className="block font-bold">Instructor Name</Text>
                <Text className="text-gray-500 text-sm">
                  Instructor Role and Organization
                </Text> */}
              </div>
            </div>

            {/* Session Selector with Radio Buttons */}
            {/* <div className="mt-6">
              <Text className="text-gray-700 font-medium">Choose Session:</Text>
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
                  className="bg-pink-400 text-white px-6 rounded-lg hover:bg-yellow-400"
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
