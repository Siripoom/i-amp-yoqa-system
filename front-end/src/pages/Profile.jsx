import { Button, Card, Input, Typography } from "antd";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const { Title } = Typography;

const Profile = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b"
      style={{
        background:
          "linear-gradient(to bottom, #FEADB4 10%, #FFFFFF 56%, #B3A1DD 100%)",
      }}
    >
      {/* Navbar อยู่ด้านบน */}
      <Navbar />

      {/* Container หลัก ใช้ flex-grow ให้เต็มหน้าจอ */}
      <div className="flex-grow flex items-center justify-center mt-4 mb-4">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-start justify-center">
          {/* Sidebar */}
          <Card className="w-full lg:w-1/4 p-6 rounded-2xl shadow-lg bg-white">
            <Title level={4} className="text-black font-semibold">
              Manage My Account
            </Title>
            <div className="mt-4 space-y-3 flex flex-col">
              <Link
                to="/profile"
                className="text-purple-600 font-semibold cursor-pointer block"
              >
                My Profile
              </Link>
              <Link
                to="/my-plane"
                className="text-gray-400 cursor-pointer block"
              >
                My Plane
              </Link>
              <Link
                to="/my-orders"
                className="text-gray-400 cursor-pointer block"
              >
                My Orders
              </Link>
            </div>
          </Card>

          {/* Profile Form */}
          <Card className="w-full lg:w-3/4 p-8 lg:ml-6 mt-6 lg:mt-0 rounded-2xl shadow-md">
            <Title level={3} className="text-purple-700">
              Edit Your Profile
            </Title>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="First Name" value="Md" disabled />
              <Input placeholder="Last Name" value="Rimel" disabled />
              <Input placeholder="Email" value="rimel1111@gmail.com" disabled />
              <Input
                placeholder="Address"
                value="Kingston, 5236, United State"
                disabled
              />
            </div>

            <Title level={5} className="mt-6">
              Password Changes
            </Title>
            <div className="grid grid-cols-1 gap-4">
              <Input.Password placeholder="Current Password" />
              <Input.Password placeholder="New Password" />
              <Input.Password placeholder="Confirm New Password" />
            </div>

            <div className="flex justify-between mt-6">
              <Button type="text">Cancel</Button>
              <Button type="primary" className="bg-pink-500 text-white">
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Profile;
