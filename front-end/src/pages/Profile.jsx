import {
  Button,
  Card,
  Input,
  Typography,
  Form,
  Alert,
  Tag,
  Statistic,
  Row,
  Col,
  Divider,
} from "antd";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserById } from "../services/userService";
import moment from "moment";
import { CalendarOutlined, HourglassOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Get user_id from localStorage
    const userId = localStorage.getItem("user_id");

    if (userId) {
      fetchUserProfile(userId);
    }
  }, []);

  const fetchUserProfile = async (id) => {
    setLoading(true);
    try {
      const response = await getUserById(id);
      setUser(response.user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format expiration date with relative time
  const formatExpiryDate = (date) => {
    if (!date) return "Not set";

    const expiryDate = moment(date).endOf("day");
    const now = moment().startOf("day");

    if (expiryDate.isBefore(now)) {
      return "Expired";
    }

    return expiryDate.format("MMMM Do YYYY");
  };

  // Calculate days left until expiration
  const getDaysLeft = (date) => {
    if (!date) return null;

    const expiryDate = moment(date).endOf("day");
    const now = moment().startOf("day");

    if (expiryDate.isBefore(now)) {
      return 0;
    }

    return expiryDate.diff(now, "days");
  };

  // Get appropriate color for expiration date
  const getExpiryColor = (date) => {
    if (!date) return "blue";

    const daysLeft = getDaysLeft(date);

    if (daysLeft === 0) return "red";
    if (daysLeft <= 7) return "orange";
    return "green";
  };

  // Get subscription status
  const getSubscriptionStatus = () => {
    if (!user) return null;

    const { remaining_session, sessions_expiry_date } = user;

    if (remaining_session <= 0) {
      return <Tag color="red">Inactive</Tag>;
    }

    if (!sessions_expiry_date) {
      return <Tag color="green">Active</Tag>;
    }

    const expiryDate = moment(sessions_expiry_date).endOf("day");
    const now = moment().startOf("day");

    if (expiryDate.isBefore(now)) {
      return <Tag color="red">Expired</Tag>;
    } else {
      return <Tag color="green">Active</Tag>;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b"
      style={{
        background:
          "linear-gradient(to bottom, #FEADB4 10%, #FFFFFF 56%, #B3A1DD 100%)",
      }}
    >
      <Navbar />

      <div className="flex-grow flex items-center justify-center mt-4 mb-4">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-start justify-center">
          <Card className="w-full lg:w-1/4 p-6 rounded-2xl shadow-lg bg-white">
            <Title level={4} className="text-black font-semibold">
              Manage My Account
            </Title>
            <div className="mt-4 space-y-3 flex flex-col">
              <Link
                to="/profile"
                className="text-purple-600 font-semibold block"
              >
                My Profile
              </Link>
              <Link to="/my-plane" className="text-gray-400 block">
                My Plane
              </Link>
              <Link to="/my-orders" className="text-gray-400 block">
                My Orders
              </Link>
            </div>
          </Card>

          {/* Profile Form */}
          <Card className="w-full lg:w-3/4 p-8 lg:ml-6 mt-6 lg:mt-0 rounded-2xl shadow-md">
            <Title level={3} className="text-purple-700">
              My Profile
            </Title>

            {/* Subscription Information Section */}
            {user && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <Title level={4} className="mb-0">
                    Subscription Status
                  </Title>
                  {getSubscriptionStatus()}
                </div>

                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Statistic
                      title="Remaining Sessions"
                      value={user.remaining_session || 0}
                      prefix={<HourglassOutlined />}
                      valueStyle={{
                        color:
                          user.remaining_session > 0 ? "#3f8600" : "#cf1322",
                      }}
                    />
                  </Col>
                  <Col xs={24} md={12}>
                    <Statistic
                      title="Expiration"
                      value={formatExpiryDate(user.sessions_expiry_date)}
                      prefix={<CalendarOutlined />}
                      valueStyle={{
                        color: getExpiryColor(user.sessions_expiry_date),
                      }}
                    />
                    {user.sessions_expiry_date &&
                      getDaysLeft(user.sessions_expiry_date) > 0 && (
                        <Text
                          type={
                            getDaysLeft(user.sessions_expiry_date) <= 7
                              ? "danger"
                              : "secondary"
                          }
                        >
                          {getDaysLeft(user.sessions_expiry_date)} days left
                        </Text>
                      )}
                  </Col>
                </Row>

                {/* Display expiration alerts */}
                {user.sessions_expiry_date &&
                  moment(user.sessions_expiry_date)
                    .endOf("day")
                    .diff(moment().startOf("day"), "days") <= 7 &&
                  moment(user.sessions_expiry_date)
                    .endOf("day")
                    .diff(moment().startOf("day"), "days") > 0 && (
                    <Alert
                      message="Expiration Warning"
                      description="Your sessions will expire soon. Please consider purchasing a new package."
                      type="warning"
                      showIcon
                      className="mt-3"
                    />
                  )}

                {user.sessions_expiry_date &&
                  moment(user.sessions_expiry_date)
                    .endOf("day")
                    .isBefore(moment().startOf("day")) && (
                    <Alert
                      message="Sessions Expired"
                      description="Your sessions have expired. Please purchase a new package to continue booking classes."
                      type="error"
                      showIcon
                      className="mt-3"
                    />
                  )}

                {/* Explanation of expiry rules */}
                <Divider />
                <div className="bg-white p-3 rounded-lg text-sm text-gray-600">
                  {/* <p>
                    <strong>How sessions expiration works:</strong>
                  </p>
                  <ul className="list-disc ml-5">
                    <li>
                      When you first purchase sessions, they are valid for 90
                      days.
                    </li>
                    <li>
                      After your first class booking, the expiration date
                      follows your package duration.
                    </li>
                    <li>
                      You cannot book classes after your sessions have expired.
                    </li>
                  </ul> */}
                  <div className="mt-3 text-right">
                    <Link to="/course">
                      <Button type="primary" className="bg-purple-600">
                        Buy More Sessions
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <Divider />

            {/* User Profile Information */}
            {loading ? (
              <div className="text-center py-4">
                Loading profile information...
              </div>
            ) : user ? (
              <Form
                layout="vertical"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <Form.Item label="ชื่อจริง">
                  <Input
                    placeholder="First Name"
                    value={user.first_name}
                    disabled
                  />
                </Form.Item>

                <Form.Item label="นามสกุล">
                  <Input
                    placeholder="Last Name"
                    value={user.last_name}
                    disabled
                  />
                </Form.Item>

                <Form.Item label="อีเมลล์">
                  <Input placeholder="Email" value={user.email} disabled />
                </Form.Item>

                <Form.Item label="เบอร์โทร">
                  <Input placeholder="Phone" value={user.phone} disabled />
                </Form.Item>

                <Form.Item label="จำนวนครั้งทั้งหมด (Total Classes) ">
                  <Input
                    placeholder="Class"
                    value={user.total_classes}
                    disabled
                  />
                </Form.Item>

                <Form.Item label="จำนวนครั้งคงเหลือ (Remaining Session)">
                  <Input
                    placeholder="Session"
                    value={user.remaining_session}
                    disabled
                  />
                </Form.Item>
              </Form>
            ) : (
              <div className="text-center py-4">
                No profile information available.
              </div>
            )}

            <Title level={5} className="mt-6">
              Password Changes
            </Title>
            <div className="grid grid-cols-1 gap-4">
              <Form.Item label="Current Password">
                <Input.Password placeholder="Current Password" />
              </Form.Item>

              <Form.Item label="New Password">
                <Input.Password placeholder="New Password" />
              </Form.Item>

              <Form.Item label="Confirm New Password">
                <Input.Password placeholder="Confirm New Password" />
              </Form.Item>
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

      <Footer />
    </div>
  );
};

export default Profile;
