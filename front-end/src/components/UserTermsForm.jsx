import React, { useState } from "react";
import {
  Button,
  Checkbox,
  Form,
  Input,
  Typography,
  Space,
  Divider,
  message,
  Card,
  Alert,
} from "antd";
import { createUserTerms } from "../services/userTermService";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

const UserTermsForm = ({ userInfo, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyConsents, setPrivacyConsents] = useState({
    registration: false,
    monitoring: false,
    planning: false,
    communication: false,
    publicity: false,
  });

  const navigate = useNavigate();
  const handleConsentChange = (type, checked) => {
    setPrivacyConsents((prev) => ({
      ...prev,
      [type]: checked,
    }));
  };

  const handleSubmit = async (values) => {
    if (!termsAccepted) {
      message.error("กรุณายอมรับข้อกำหนดและเงื่อนไขการใช้บริการ");
      return;
    }

    const requiredConsents = [
      "registration",
      "monitoring",
      "planning",
      "communication",
    ];
    const hasAllRequiredConsents = requiredConsents.every(
      (consent) => privacyConsents[consent]
    );

    if (!hasAllRequiredConsents) {
      message.error("กรุณาให้ความยินยอมในข้อที่จำเป็นสำหรับการใช้บริการ");
      return;
    }

    setLoading(true);
    try {
      const termData = {
        fullName: values.fullName,
      };

      await createUserTerms(termData);
      message.success("ยืนยันข้อกำหนดและเงื่อนไขเรียบร้อยแล้ว");
      setTimeout(() => navigate("/auth/signin"), 1000);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error submitting user terms:", error);
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="user-terms-container"
      style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}
    >
      {/* Header */}
      <Card style={{ marginBottom: "24px", textAlign: "center" }}>
        <Title level={2} style={{ color: "#d4380d", marginBottom: "8px" }}>
          ไอแอมป์โยคะ หรือ i'amp yoqa
        </Title>
        <Paragraph style={{ fontSize: "16px", color: "#666" }}>
          เป็นสถาบันที่ยึดมั่นในการส่งเสริมสุขภาพของผู้ใช้บริการผ่านการฝึกโยคะอย่างมีประสิทธิภาพ
          โดยมีเป้าหมายเพื่อให้สมาชิกทุกท่านมีสุขภาพที่ดีทั้งกายและใจ
        </Paragraph>
      </Card>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Terms and Conditions Section */}
        <Card
          title="ข้อกำหนดและเงื่อนไขการใช้บริการ"
          style={{ marginBottom: "24px" }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Text strong style={{ color: "#d4380d" }}>
                1. สมาชิกที่มีประวัติสุขภาพ
              </Text>
              <Paragraph style={{ marginTop: "8px", marginLeft: "16px" }}>
                อาการเจ็บป่วย หรือโรคประจำตัว เช่น ความดันโลหิตสูงหรือต่ำผิดปกติ
                หมอนรองกระดูกทับเส้นประสาท ฯลฯ
                มีหน้าที่ต้องแจ้งให้ไอแอมป์โยคะทราบก่อนเข้าร่วมการฝึกโยคะในทุกครั้ง
              </Paragraph>
            </div>

            <div>
              <Text strong style={{ color: "#d4380d" }}>
                2. สมาชิกที่มีโรคประจำตัวร้ายแรง
              </Text>
              <Paragraph style={{ marginTop: "8px", marginLeft: "16px" }}>
                เช่น โรคหัวใจ โรคหัวใจล้มเหลว โรคหลอดเลือดหัวใจ โรคหลอดเลือดสมอง
                โรคไตวายเรื้อรัง โรคมะเร็ง ฯลฯ
                ต้องแจ้งให้ไอแอมป์โยคะทราบล่วงหน้าทุกครั้งก่อนการฝึกโยคะ
                และต้องได้รับอนุญาตจากแพทย์ผู้ดูแลก่อนเข้าร่วมการฝึกทุกครั้ง
              </Paragraph>
            </div>

            <div>
              <Text strong style={{ color: "#d4380d" }}>
                3. สมาชิกที่อยู่ระหว่างตั้งครรภ์
              </Text>
              <Paragraph style={{ marginTop: "8px", marginLeft: "16px" }}>
                มีหน้าที่แจ้งให้ไอแอมป์โยคะทราบก่อนการฝึกทุกครั้ง
                และต้องแสดงหลักฐานการอนุญาตจากแพทย์
                ไอแอมป์โยคะแนะนำให้เข้าร่วมในคลาสโยคะที่จัดขึ้นเฉพาะสำหรับผู้ตั้งครรภ์เท่านั้น
              </Paragraph>
            </div>

            <div>
              <Text strong style={{ color: "#d4380d" }}>
                4. สมาชิกที่เพิ่งผ่านการผ่าตัดหรือศัลยกรรม
              </Text>
              <Paragraph style={{ marginTop: "8px", marginLeft: "16px" }}>
                เช่น การผ่าคลอด ผ่าช่องท้อง การผ่าตัดเต้านม เสริมจมูก
                หรือผ่านกระบวนการเลเซอร์ใด ๆ
                ควรงดหรือชะลอการฝึกโยคะจนกว่าจะพ้นระยะเวลาพักฟื้นตามคำแนะนำของแพทย์
              </Paragraph>
            </div>

            <div>
              <Text strong style={{ color: "#d4380d" }}>
                5. การตรวจสอบความพร้อมของร่างกายและจิตใจก่อนฝึก
              </Text>
              <Paragraph style={{ marginTop: "8px", marginLeft: "16px" }}>
                ไอแอมป์โยคะแนะนำให้สมาชิกประเมินสภาพร่างกายและจิตใจของตนเองก่อนเข้าร่วมฝึกทุกครั้ง
                หากไม่อยู่ในสภาวะที่เหมาะสม ควรงดเว้นการฝึกชั่วคราว
              </Paragraph>
            </div>

            <Alert
              message="ข้อสำคัญเกี่ยวกับความรับผิดชอบ"
              description="ในวันที่เข้าฝึกโยคะนี้สมาชิกตกลงและรับรองว่าได้แจ้งข้อมูลเกี่ยวกับสุขภาพของตนเองอย่างครบถ้วนต่อไอแอมป์โยคะแล้ว และได้ปรึกษาแพทย์และได้รับอนุญาตให้สามารถเข้าร่วมการฝึกโยคะได้อย่างปลอดภัย สมาชิกยินยอมรับความเสี่ยงภายใต้การฝึกอย่างระมัดระวัง และไอแอมป์โยคะจะรับผิดเฉพาะความเสียหายหรือผลกระทบที่เกิดจากการกระทำโดยเจตนาของไอแอมป์โยคะเท่านั้น"
              type="warning"
              showIcon
              style={{ marginTop: "16px" }}
            />
          </Space>
        </Card>

        {/* Privacy Consent Section */}
        <Card
          title="หนังสือให้ความยินยอมเก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคล"
          style={{ marginBottom: "24px" }}
        >
          <Form.Item
            label="ชื่อ-นามสกุล"
            name="fullName"
            rules={[{ required: true, message: "กรุณากรอกชื่อ-นามสกุล" }]}
          >
            <Input placeholder="กรุณากรอกชื่อ-นามสกุล" size="large" />
          </Form.Item>

          <Divider orientation="left">การให้ความยินยอม</Divider>

          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div
              style={{
                padding: "12px",
                backgroundColor: "#f6ffed",
                borderRadius: "6px",
                border: "1px solid #b7eb8f",
              }}
            >
              <Checkbox
                checked={privacyConsents.registration}
                onChange={(e) =>
                  handleConsentChange("registration", e.target.checked)
                }
              >
                <Text strong style={{ color: "#389e0d" }}>
                  1. เพื่อใช้ในการดำเนินการลงทะเบียน ตรวจสอบ
                  ยืนยันตัวบุคคลของผู้เข้าเรียน (จำเป็น)
                </Text>
              </Checkbox>
            </div>

            <div
              style={{
                padding: "12px",
                backgroundColor: "#f6ffed",
                borderRadius: "6px",
                border: "1px solid #b7eb8f",
              }}
            >
              <Checkbox
                checked={privacyConsents.monitoring}
                onChange={(e) =>
                  handleConsentChange("monitoring", e.target.checked)
                }
              >
                <Text strong style={{ color: "#389e0d" }}>
                  2. เพื่อติดตามผล ดูแล
                  และประเมินผลลัพธ์ของผู้เข้าเรียนได้อย่างต่อเนื่องและเหมาะสม
                  (จำเป็น)
                </Text>
              </Checkbox>
            </div>

            <div
              style={{
                padding: "12px",
                backgroundColor: "#f6ffed",
                borderRadius: "6px",
                border: "1px solid #b7eb8f",
              }}
            >
              <Checkbox
                checked={privacyConsents.planning}
                onChange={(e) =>
                  handleConsentChange("planning", e.target.checked)
                }
              >
                <Text strong style={{ color: "#389e0d" }}>
                  3. เพื่อใช้ในการวางแผนการจัดการเรียนการสอน
                  ตลอดจนการออกแบบเนื้อหา รูปแบบ
                  หรือวิธีการสอนที่เหมาะสมกับลักษณะเฉพาะของผู้เรียน (จำเป็น)
                </Text>
              </Checkbox>
            </div>

            <div
              style={{
                padding: "12px",
                backgroundColor: "#f6ffed",
                borderRadius: "6px",
                border: "1px solid #b7eb8f",
              }}
            >
              <Checkbox
                checked={privacyConsents.communication}
                onChange={(e) =>
                  handleConsentChange("communication", e.target.checked)
                }
              >
                <Text strong style={{ color: "#389e0d" }}>
                  4. เพื่อใช้ในการติดต่อสื่อสาร แจ้งข่าวสาร ส่งข้อมูล
                  รวมถึงการจัดส่งเอกสารหรือข้อมูลอื่นใดที่เกี่ยวข้องกับกิจกรรมของสถาบัน
                  (จำเป็น)
                </Text>
              </Checkbox>
            </div>

            <div
              style={{
                padding: "12px",
                backgroundColor: "#fff7e6",
                borderRadius: "6px",
                border: "1px solid #ffd591",
              }}
            >
              <Checkbox
                checked={privacyConsents.publicity}
                onChange={(e) =>
                  handleConsentChange("publicity", e.target.checked)
                }
              >
                <Text strong style={{ color: "#d48806" }}>
                  5. เพื่อใช้ในการประชาสัมพันธ์กิจกรรมของสถาบัน
                  ไม่ว่าจะผ่านสื่ออิเล็กทรอนิกส์ เช่น เว็บไซต์ เฟซบุ๊ก
                  หรือแพลตฟอร์มออนไลน์อื่นใด (ไม่บังคับ)
                </Text>
              </Checkbox>
            </div>
          </Space>
        </Card>

        {/* Contact Information */}
        <Card style={{ marginBottom: "24px", backgroundColor: "#f0f2f5" }}>
          <Title level={5} style={{ marginBottom: "16px" }}>
            ช่องทางติดต่อสอบถาม
          </Title>
          <Paragraph>
            ผู้เรียนสามารถติดต่อสถาบันเพื่อสอบถามรายละเอียดเพิ่มเติมหรือใช้สิทธิตามกฎหมายได้ผ่านช่องทางต่อไปนี้
          </Paragraph>
          <Space direction="vertical">
            <Text strong style={{ color: "#1890ff" }}>
              Facebook: ไอแอมป์โยคะ : I'amp yoqa
            </Text>
            <Text strong style={{ color: "#1890ff" }}>
              Email: iampyoqa@gmail.com
            </Text>
          </Space>
        </Card>

        {/* Final Acceptance */}
        <Card style={{ marginBottom: "24px", borderColor: "#d4380d" }}>
          <Checkbox
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            style={{ fontSize: "16px" }}
          >
            <Text strong style={{ color: "#d4380d", fontSize: "16px" }}>
              ยอมรับข้อกำหนดและให้ความยินยอมทั้งหมด
            </Text>
          </Checkbox>

          {!termsAccepted && (
            <Alert
              message="กรุณายืนยันการยอมรับ"
              description="คุณจำเป็นต้องยอมรับข้อกำหนดและเงื่อนไขเพื่อดำเนินการต่อ"
              type="info"
              showIcon
              style={{ marginTop: "16px" }}
            />
          )}
        </Card>

        {/* Action Buttons */}
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <Space size="large">
            {onCancel && (
              <Button size="large" onClick={onCancel} disabled={loading}>
                ยกเลิก
              </Button>
            )}
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              disabled={!termsAccepted}
              style={{
                backgroundColor: "#d4380d",
                borderColor: "#d4380d",
                minWidth: "200px",
                height: "48px",
                fontSize: "16px",
              }}
            >
              ยืนยันและดำเนินการต่อ
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default UserTermsForm;
