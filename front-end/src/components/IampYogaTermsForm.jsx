import React, { useState, useEffect } from "react";
import {
  Button,
  Typography,
  Card,
  Space,
  Divider,
  Input,
  Modal,
  Alert,
  message,
  Spin,
  Checkbox,
} from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const IampYogaTermsForm = ({
  userId,
  onComplete,
  isVisible = true,
  onCancel,
  existingTerms = null,
}) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(isVisible);

  // State สำหรับ form fields
  const [fullName, setFullName] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [personalDataConsents, setPersonalDataConsents] = useState({
    registration: false,
    tracking: false,
    planning: false,
    communication: false,
    marketing: false,
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existingTerms) {
      setFullName(existingTerms.fullName || "");
      setMembershipId(existingTerms.membershipId || "");
      setAcceptTerms(existingTerms.acceptTerms || false);
      setPersonalDataConsents(
        existingTerms.personalDataConsents || {
          registration: false,
          tracking: false,
          planning: false,
          communication: false,
          marketing: false,
        }
      );
    }
  }, [existingTerms]);

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "กรุณากรอกชื่อ-นามสกุล";
    }

    if (!membershipId.trim()) {
      newErrors.membershipId = "กรุณากรอกรหัสสมาชิก";
    }

    if (!acceptTerms) {
      newErrors.acceptTerms = "กรุณายอมรับข้อกำหนดและเงื่อนไขการใช้บริการ";
    }

    if (!personalDataConsents.registration) {
      newErrors.registration = "จำเป็นต้องยินยอมให้เก็บข้อมูลเพื่อการลงทะเบียน";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // แสดง error แรกที่เจอ
      const firstError = Object.values(errors)[0];
      if (firstError) {
        message.error(firstError);
      }
      return;
    }

    setLoading(true);
    try {
      const termsData = {
        userId,
        fullName: fullName.trim(),
        membershipId: membershipId.trim(),
        acceptTerms,
        personalDataConsents,
        acceptedAt: new Date().toISOString(),
        ipAddress: "127.0.0.1",
        userAgent: navigator.userAgent,
      };

      // Import service at runtime to avoid dependency issues
      const { createUserTerms, updateUserTerms } = await import(
        "../services/userTermsService"
      );

      let response;
      if (existingTerms) {
        response = await updateUserTerms(userId, termsData);
        message.success("อัพเดทข้อกำหนดเรียบร้อยแล้ว");
      } else {
        response = await createUserTerms(termsData);
        message.success("บันทึกข้อกำหนดเรียบร้อยแล้ว");
      }

      setShowModal(false);
      if (onComplete) {
        onComplete(response);
      }
    } catch (error) {
      console.error("Error submitting terms:", error);
      message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handlePersonalDataChange = (key, checked) => {
    setPersonalDataConsents((prev) => ({
      ...prev,
      [key]: checked,
    }));
    // Clear error if user checks required field
    if (key === "registration" && checked && errors.registration) {
      setErrors((prev) => ({ ...prev, registration: null }));
    }
  };

  const handleInputChange = (field, value) => {
    if (field === "fullName") {
      setFullName(value);
      if (errors.fullName && value.trim()) {
        setErrors((prev) => ({ ...prev, fullName: null }));
      }
    } else if (field === "membershipId") {
      setMembershipId(value);
      if (errors.membershipId && value.trim()) {
        setErrors((prev) => ({ ...prev, membershipId: null }));
      }
    }
  };

  const handleTermsChange = (checked) => {
    setAcceptTerms(checked);
    if (errors.acceptTerms && checked) {
      setErrors((prev) => ({ ...prev, acceptTerms: null }));
    }
  };

  const isFormValid =
    acceptTerms &&
    personalDataConsents.registration &&
    fullName.trim() &&
    membershipId.trim();

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined style={{ color: "#1890ff" }} />
          <span>ข้อกำหนดและเงื่อนไขการใช้บริการไอแอมป์โยคะ</span>
        </Space>
      }
      open={showModal}
      onCancel={handleCancel}
      footer={null}
      width={800}
      closable={!loading}
      maskClosable={false}
      style={{ top: 20 }}
    >
      <Spin spinning={loading}>
        <div
          style={{ maxHeight: "70vh", overflowY: "auto", padding: "0 24px" }}
        >
          <Alert
            message="จำเป็นต้องยอมรับข้อกำหนด"
            description="คุณจำเป็นต้องอ่านและยอมรับข้อกำหนดและเงื่อนไขเพื่อใช้บริการต่อไป"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          {/* ข้อมูลส่วนตัว */}
          <Card
            title={
              <>
                <UserOutlined /> ข้อมูลสมาชิก
              </>
            }
            style={{ marginBottom: 24 }}
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong>ชื่อ-นามสกุล *</Text>
              <Input
                placeholder="กรอกชื่อ-นามสกุลของคุณ"
                value={fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                status={errors.fullName ? "error" : ""}
                style={{ marginTop: 8 }}
              />
              {errors.fullName && (
                <Text type="danger" style={{ fontSize: "12px" }}>
                  {errors.fullName}
                </Text>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>รหัสสมาชิก *</Text>
              <Input
                placeholder="กรอกรหัสสมาชิกของคุณ"
                value={membershipId}
                onChange={(e) =>
                  handleInputChange("membershipId", e.target.value)
                }
                status={errors.membershipId ? "error" : ""}
                style={{ marginTop: 8 }}
              />
              {errors.membershipId && (
                <Text type="danger" style={{ fontSize: "12px" }}>
                  {errors.membershipId}
                </Text>
              )}
            </div>
          </Card>

          {/* ข้อกำหนดและเงื่อนไข */}
          <Card
            title={
              <>
                <SafetyOutlined /> ข้อกำหนดและเงื่อนไขการใช้บริการ
              </>
            }
            style={{ marginBottom: 24 }}
          >
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                padding: "16px",
                background: "#f9f9f9",
                borderRadius: "6px",
              }}
            >
              <Title level={4}>ไอแอมป์โยคะ หรือ I&apos;amp yoqa</Title>
              <Paragraph>
                เป็นสถาบันที่ยึดมั่นในการส่งเสริมสุขภาพของผู้ใช้บริการผ่านการฝึกโยคะอย่างมีประสิทธิภาพ
                โดยมีเป้าหมายเพื่อให้สมาชิกทุกท่านมีสุขภาพที่ดีทั้งกายและใจ
              </Paragraph>

              <Title level={5}>1. สมาชิกที่มีประวัติสุขภาพ</Title>
              <Paragraph>
                อาการเจ็บป่วย หรือโรคประจำตัว เช่น ความดันโลหิตสูงหรือต่ำผิดปกติ
                หมอนรองกระดูกทับเส้นประสาท ฯลฯ
                มีหน้าที่ต้องแจ้งให้ไอแอมป์โยคะทราบก่อนเข้าร่วมการฝึกโยคะในทุกครั้ง
              </Paragraph>

              <Title level={5}>2. สมาชิกที่มีโรคประจำตัวร้ายแรง</Title>
              <Paragraph>
                เช่น โรคหัวใจ โรคหัวใจล้มเหลว โรคหลอดเลือดหัวใจ โรคหลอดเลือดสมอง
                โรคไตวายเรื้อรัง โรคมะเร็ง ฯลฯ
                ต้องแจ้งให้ไอแอมป์โยคะทราบล่วงหน้าทุกครั้งก่อนการฝึกโยคะ
                และต้องได้รับอนุญาตจากแพทย์ผู้ดูแลก่อนเข้าร่วมการฝึกทุกครั้ง
              </Paragraph>

              <Title level={5}>3. สมาชิกที่อยู่ระหว่างตั้งครรภ์</Title>
              <Paragraph>
                มีหน้าที่แจ้งให้ไอแอมป์โยคะทราบก่อนการฝึกทุกครั้ง
                และต้องแสดงหลักฐานการอนุญาตจากแพทย์
                ไอแอมป์โยคะแนะนำให้เข้าร่วมในคลาสโยคะที่จัดขึ้นเฉพาะสำหรับผู้ตั้งครรภ์เท่านั้น
              </Paragraph>

              <Title level={5}>
                4. การตรวจสอบความพร้อมของร่างกายและจิตใจก่อนฝึก
              </Title>
              <Paragraph>
                ไอแอมป์โยคะแนะนำให้สมาชิกประเมินสภาพร่างกายและจิตใจของตนเองก่อนเข้าร่วมฝึกทุกครั้ง
                หากไม่อยู่ในสภาวะที่เหมาะสม ควรงดเว้นการฝึกชั่วคราว
              </Paragraph>

              <Title level={5}>5. การใช้อุปกรณ์ฝึกโยคะ</Title>
              <Paragraph>
                สมาชิกควรตรวจสอบให้อุปกรณ์ที่ใช้มีมาตรฐานและอยู่ในสภาพพร้อมใช้งาน
                หากพบว่าอุปกรณ์มีข้อบกพร่องหรือไม่ปลอดภัย ควรงดใช้งานทันที
              </Paragraph>

              <Title level={5}>6. พื้นที่ฝึกโยคะที่ปลอดภัย</Title>
              <Paragraph>
                สมาชิกควรเลือกฝึกโยคะบริเวณพื้นที่โล่งพอสมควร
                โดยเว้นระยะห่างอย่างน้อย 1.5-2 เมตรรอบตัว
                เพื่อป้องกันการชนสิ่งของต่างๆ
              </Paragraph>

              <Title level={5}>7. ข้อจำกัดความรับผิดชอบ</Title>
              <Paragraph
                style={{
                  background: "#fff2e8",
                  padding: "12px",
                  borderRadius: "4px",
                }}
              >
                <Text strong>
                  สมาชิกตกลงและรับรองว่าได้แจ้งข้อมูลเกี่ยวกับสุขภาพของตนเองอย่างครบถ้วนต่อไอแอมป์โยคะแล้ว
                  และยินยอมรับความเสี่ยงภายใต้การฝึกอย่างระมัดระวัง
                  ไอแอมป์โยคะขอสงวนสิทธิ์ไม่รับผิดชอบต่อความเสียหาย
                  หรือผลกระทบที่ไม่ได้เกิดจากความผิดของไอแอมป์โยคะ
                </Text>
              </Paragraph>
            </div>

            <Divider />

            <div>
              <Checkbox
                checked={acceptTerms}
                onChange={(e) => handleTermsChange(e.target.checked)}
                style={{ fontSize: "16px" }}
              >
                <Text strong>ยอมรับข้อกำหนดและให้ความยินยอม</Text>
              </Checkbox>
              {errors.acceptTerms && (
                <div style={{ marginTop: 8 }}>
                  <Text type="danger" style={{ fontSize: "12px" }}>
                    {errors.acceptTerms}
                  </Text>
                </div>
              )}
            </div>
          </Card>

          {/* การให้ความยินยอมเก็บข้อมูลส่วนบุคคล */}
          <Card
            title="หนังสือให้ความยินยอมเก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคล"
            style={{ marginBottom: 24 }}
          >
            <Alert
              message="การยินยอมที่จำเป็น"
              description="ข้อ 1 (การลงทะเบียน) เป็นข้อที่จำเป็นสำหรับการใช้บริการ ส่วนข้ออื่นๆ เป็นทางเลือก"
              type="warning"
              style={{ marginBottom: 16 }}
            />

            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <div>
                <Checkbox
                  checked={personalDataConsents.registration}
                  onChange={(e) =>
                    handlePersonalDataChange("registration", e.target.checked)
                  }
                >
                  <Text strong style={{ color: "#d4380d" }}>
                    เพื่อใช้ในการดำเนินการลงทะเบียน ตรวจสอบ
                    ยืนยันตัวบุคคลของผู้เข้าเรียน (จำเป็น)
                  </Text>
                </Checkbox>
                {errors.registration && (
                  <div style={{ marginTop: 4, marginLeft: 24 }}>
                    <Text type="danger" style={{ fontSize: "12px" }}>
                      {errors.registration}
                    </Text>
                  </div>
                )}
              </div>

              <Checkbox
                checked={personalDataConsents.tracking}
                onChange={(e) =>
                  handlePersonalDataChange("tracking", e.target.checked)
                }
              >
                เพื่อติดตามผล ดูแล
                และประเมินผลลัพธ์ของผู้เข้าเรียนได้อย่างต่อเนื่องและเหมาะสม
              </Checkbox>

              <Checkbox
                checked={personalDataConsents.planning}
                onChange={(e) =>
                  handlePersonalDataChange("planning", e.target.checked)
                }
              >
                เพื่อใช้ในการวางแผนการจัดการเรียนการสอน ตลอดจนการออกแบบเนื้อหา
                รูปแบบ หรือวิธีการสอนที่เหมาะสมกับลักษณะเฉพาะของผู้เรียน
              </Checkbox>

              <Checkbox
                checked={personalDataConsents.communication}
                onChange={(e) =>
                  handlePersonalDataChange("communication", e.target.checked)
                }
              >
                เพื่อใช้ในการติดต่อสื่อสาร แจ้งข่าวสาร ส่งข้อมูล
                รวมถึงการจัดส่งเอกสารหรือข้อมูลอื่นใดที่เกี่ยวข้องกับกิจกรรมของสถาบันให้แก่ผู้เรียน
              </Checkbox>

              <Checkbox
                checked={personalDataConsents.marketing}
                onChange={(e) =>
                  handlePersonalDataChange("marketing", e.target.checked)
                }
              >
                เพื่อใช้ในการประชาสัมพันธ์กิจกรรมของสถาบัน
                ผ่านสื่ออิเล็กทรอนิกส์ต่างๆ และสื่อสิ่งพิมพ์
              </Checkbox>
            </Space>

            <Divider />

            <div
              style={{
                background: "#f6ffed",
                padding: "16px",
                borderRadius: "6px",
              }}
            >
              <Text>
                <strong>ช่องทางติดต่อ:</strong>
                <br />
                Facebook: ไอแอมป์โยคะ : I&apos;amp yoqa
                <br />
                Email: iampyoqa@gmail.com
              </Text>
            </div>
          </Card>

          {/* ปุ่มส่งข้อมูล */}
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Space size="large">
              <Button onClick={handleCancel} disabled={loading}>
                ยกเลิก
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                icon={<CheckCircleOutlined />}
                disabled={!isFormValid}
                loading={loading}
                size="large"
              >
                {existingTerms ? "อัพเดทข้อกำหนด" : "ยอมรับและดำเนินการต่อ"}
              </Button>
            </Space>
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default IampYogaTermsForm;
