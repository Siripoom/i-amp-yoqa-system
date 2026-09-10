import { colors } from "../theme/tokens.js";
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
  Select,
  message,
} from "antd";
import "../styles/Home.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "../services/userService";
import moment from "moment";
import { CalendarOutlined, HourglassOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasMedicalCondition, setHasMedicalCondition] = useState(null);
  const [form] = Form.useForm();

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMyProfile();
      setUser(response.user);
      setHasMedicalCondition(response.user.has_medical_condition);
      form.setFieldsValue(response.user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (localStorage.getItem("token")) {
      fetchUserProfile();
    }
  }, [fetchUserProfile]);

  const saveProfile = async (values) => {
    setSaving(true);
    try {
      const response = await updateMyProfile(values);
      setUser(response.user);
      form.setFieldsValue(response.user);
      message.success("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว");
    } catch (error) {
      message.error(error.response?.data?.message || "บันทึกโปรไฟล์ไม่สำเร็จ");
    } finally {
      setSaving(false);
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
      return <Tag color="error">Inactive</Tag>;
    }

    if (!sessions_expiry_date) {
      return <Tag color="success">Active</Tag>;
    }

    const expiryDate = moment(sessions_expiry_date).endOf("day");
    const now = moment().startOf("day");

    if (expiryDate.isBefore(now)) {
      return <Tag color="error">Expired</Tag>;
    } else {
      return <Tag color="success">Active</Tag>;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b"
      style={{
        background:
          "var(--color-background)",
      }}
    >
      <Navbar />

      <div className="flex-grow flex items-center justify-center mt-4 mb-4">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-start justify-center">
          <Card className="w-full lg:w-1/4 p-6 rounded-2xl shadow-lg bg-white">
            <Title level={4} className="text-text font-semibold">
              Manage My Account
            </Title>
            <div className="mt-4 space-y-3 flex flex-col">
              <Link
                to="/profile"
                className="text-primary font-semibold block"
              >
                My Profile
              </Link>
              <Link to="/my-plane" className="text-secondary block">
                My Plane
              </Link>
              <Link to="/my-orders" className="text-secondary block">
                My Orders
              </Link>
            </div>
          </Card>

          {/* Profile Form */}
          <Card className="w-full lg:w-3/4 p-8 lg:ml-6 mt-6 lg:mt-0 rounded-2xl shadow-md">
            <Title level={3} className="text-primary">
              My Profile
            </Title>

            {/* Subscription Information Section */}
            {user && (
              <div className="mb-6 bg-background p-4 rounded-lg">
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
                          user.remaining_session > 0 ? colors["success"] : colors["error"],
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
                <div className="bg-white p-3 rounded-lg text-sm text-secondary">
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
                      <Button type="primary" className="bg-primary">
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
                form={form}
                layout="vertical"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                onFinish={saveProfile}
              >
                <Form.Item label="ชื่อจริง" name="first_name" rules={[{ required: true }]}>
                  <Input
                    placeholder="First Name"
                  />
                </Form.Item>

                <Form.Item label="นามสกุล" name="last_name" rules={[{ required: true }]}>
                  <Input
                    placeholder="Last Name"
                  />
                </Form.Item>

                <Form.Item label="อีเมลล์">
                  <Input placeholder="Email" value={user.email} disabled />
                </Form.Item>

                <Form.Item label="เบอร์โทร" name="phone" rules={[{ required: true }]}>
                  <Input placeholder="Phone" />
                </Form.Item>

                <Form.Item label="เพศ" name="gender" rules={[{ required: true, message: "กรุณาเลือกเพศ" }]}>
                  <Select placeholder="เลือกเพศ">
                    <Select.Option value="female">หญิง</Select.Option>
                    <Select.Option value="male">ชาย</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="ที่อยู่"
                  name="address"
                  rules={[{ required: true, whitespace: true, message: "กรุณากรอกที่อยู่" }]}
                  className="md:col-span-2"
                >
                  <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item
                  label="โรคประจำตัว"
                  name="has_medical_condition"
                  rules={[{ required: true, message: "กรุณาระบุโรคประจำตัว" }]}
                >
                  <Select onChange={setHasMedicalCondition} placeholder="เลือกข้อมูลโรคประจำตัว">
                    <Select.Option value={false}>ไม่มีโรคประจำตัว</Select.Option>
                    <Select.Option value={true}>มีโรคประจำตัว</Select.Option>
                  </Select>
                </Form.Item>

                {hasMedicalCondition === true && (
                  <Form.Item
                    label="รายละเอียดโรคประจำตัว"
                    name="medical_condition_details"
                    rules={[{ required: true, whitespace: true, message: "กรุณากรอกรายละเอียด" }]}
                  >
                    <Input.TextArea rows={3} />
                  </Form.Item>
                )}

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
              <Button
                type="primary"
                className="bg-primary text-white"
                loading={saving}
                onClick={() => form.submit()}
              >
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
