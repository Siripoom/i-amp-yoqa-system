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
        privacyConsents: privacyConsents,
        termsAccepted: termsAccepted,
      };

      await createUserTerms(termData);
      message.success("ยืนยันข้อกำหนดและเงื่อนไขเรียบร้อยแล้ว");
      
      // Check if user came from LINE login
      const loginMethod = localStorage.getItem("loginMethod");
      const userRole = localStorage.getItem("role");
      
      if (loginMethod === "line") {
        // Redirect based on role for LINE users
        if (userRole === "Admin") {
          setTimeout(() => navigate("/admin/dashboard"), 1000);
        } else {
          setTimeout(() => navigate("/"), 1000);
        }
      } else {
        // Default redirect to sign in for regular users
        setTimeout(() => navigate("/auth/signin"), 1000);
      }
      
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
          เป็นไอแอมป์โยคะ
          ที่ยึดมั่นในการส่งเสริมสุขภาพของผู้ใช้บริการผ่านการฝึกโยคะอย่างมีประสิทธิภาพ
          โดยมีเป้าหมายเพื่อให้สมาชิกทุกท่านมีสุขภาพที่ดีทั้งกายและใจ ทั้งนี้
          ก่อนการเข้าใช้บริการของไอแอมป์โยคะในแต่ละครั้งนั้น
          สมาชิกทุกท่านจะต้องปฏิบัติตามข้อกำหนดและเงื่อนไขการใช้บริการไอแอมป์โยคะอย่างเคร่งครัด
        </Paragraph>
      </Card>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Terms and Conditions Section */}
        <Card
          title="ข้อกำหนดและเงื่อนไขการใช้บริการไอแอมป์โยคะ"
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
                เพื่อให้สามารถประเมินความเหมาะสม
                ให้คำแนะนำที่สอดคล้องกับสภาพร่างกายของสมาชิก
                และป้องกันปัญหาด้านสุขภาพที่อาจเกิดขึ้นภายหลังการฝึก
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
                หากไม่ได้รับอนุญาตจากแพทย์
                ไอแอมป์โยคะขอแนะนำให้งดหรือชะลอการฝึกเพื่อความปลอดภัยสูงสุด
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
                ทั้งนี้
                เพื่อหลีกเลี่ยงอาการบาดเจ็บหรือความเสี่ยงที่อาจส่งผลต่อการตั้งครรภ์
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
                เพื่อหลีกเลี่ยงภาวะแทรกซ้อนหรือการบาดเจ็บเพิ่มเติม
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

            <div>
              <Text strong style={{ color: "#d4380d" }}>
                6. การปฏิบัติตามคำแนะนำของครูฝึก
              </Text>
              <Paragraph style={{ marginTop: "8px", marginLeft: "16px" }}>
                ควรให้ความสำคัญกับการควบคุมลมหายใจเข้า--ออก การยืดกล้ามเนื้อ
                และการใช้แรงอย่างเหมาะสมในแต่ละท่า
                เพื่อป้องกันอาการบาดเจ็บหรือภาวะผิดปกติทางร่างกาย
              </Paragraph>
            </div>

            <div>
              <Text strong style={{ color: "#d4380d" }}>
                7. การแจ้งอาการบาดเจ็บภายหลังการฝึก
              </Text>
              <Paragraph style={{ marginTop: "8px", marginLeft: "16px" }}>
                หากมีอาการเจ็บปวด บาดเจ็บ หรือผิดปกติใด ๆ
                ที่เกิดขึ้นระหว่างหรือหลังฝึก
                สมาชิกควรแจ้งให้ไอแอมป์โยคะทราบโดยเร็ว
                เพื่อให้สามารถให้คำแนะนำในการดูแลเบื้องต้นหรือการปรับเปลี่ยนแนวทางการฝึกให้เหมาะสม
              </Paragraph>
            </div>

            <div>
              <Text strong style={{ color: "#d4380d" }}>
                8. การหลีกเลี่ยงท่าฝึกที่ไม่เหมาะสมหรือเกินขีดจำกัด
              </Text>
              <Paragraph style={{ marginTop: "8px", marginLeft: "16px" }}>
                ไอแอมป์โยคะไม่แนะนำให้สมาชิกฝืนปฏิบัติในท่าที่มีความเสี่ยงสูงหรือไม่เหมาะสมกับตนเอง
                เช่น ท่ายืนด้วยศีรษะ ท่าสะพานโค้ง ฯลฯ
                ซึ่งอาจนำไปสู่อาการบาดเจ็บได้
              </Paragraph>
            </div>

            <div>
              <Text strong style={{ color: "#d4380d" }}>
                9. การใช้อุปกรณ์ฝึกโยคะ
              </Text>
              <Paragraph style={{ marginTop: "8px", marginLeft: "16px" }}>
                สมาชิกควรตรวจสอบให้อุปกรณ์ที่ใช้มีมาตรฐานและอยู่ในสภาพพร้อมใช้งาน
                หากพบว่าอุปกรณ์มีข้อบกพร่องหรือไม่ปลอดภัย
                ไอแอมป์โยคะแนะนำให้งดใช้งานอุปกรณ์ดังกล่าวทันที
                เพื่อหลีกเลี่ยงความเสี่ยงจากการฝึก
              </Paragraph>
            </div>

            <div>
              <Text strong style={{ color: "#d4380d" }}>
                10. พื้นที่ฝึกโยคะที่ปลอดภัย
              </Text>
              <Paragraph style={{ marginTop: "8px", marginLeft: "16px" }}>
                สมาชิกควรเลือกฝึกโยคะบริเวณพื้นที่โล่งพอสมควร
                โดยเว้นระยะห่างอย่างน้อย 1.5--2 เมตรรอบตัว
                เพื่อป้องกันการชนสิ่งของ เช่น โต๊ะ เก้าอี้ ตู้ หรือของมีคม ฯลฯ
                ตลอดจนฝึกโยคะในบริเวณที่พื้นราบ ไม่มีความลาดเอียง
                และไม่มีพื้นผิวลื่น
                เพื่อป้องกันการล้มหรือบาดเจ็บจากการทรงตัวไม่ดี
              </Paragraph>
            </div>

            <Paragraph
              style={{
                marginTop: "24px",
                padding: "16px",
                backgroundColor: "#f6f8fa",
                borderRadius: "6px",
              }}
            >
              ไอแอมป์โยคะมีความมุ่งมั่นอย่างยิ่งในการส่งเสริมให้สมาชิกทุกท่านมีสุขภาพที่ดีทั้งทางร่างกายและจิตใจ
              ด้วยเหตุนี้
              หากสมาชิกท่านใดมีเหตุอันไม่พร้อมในการเข้าร่วมการฝึกโยคะ
              ไม่ว่าจะเป็นการมีโรคประจำตัว อาการเจ็บป่วย
              หรืออุปกรณ์ที่ใช้ในการฝึกโยคะไม่อยู่ในสภาพพร้อมใช้งาน เป็นต้น
              ไอแอมป์โยคะขอแนะนำให้สมาชิกงดหรือเลื่อนการเข้าฝึกออกไป
              จนกว่าสมาชิกและอุปกรณ์จะอยู่ในสภาพที่เหมาะสมและปลอดภัยต่อการฝึก
            </Paragraph>

            <Paragraph
              style={{
                marginTop: "16px",
                padding: "16px",
                backgroundColor: "#fff2e8",
                borderRadius: "6px",
              }}
            >
              ทั้งนี้ การฝึกโยคะของไอแอมป์โยคะดำเนินการผ่านระบบอิเล็กทรอนิกส์
              (Online)
              ซึ่งอาจมีข้อจำกัดในการให้ความช่วยเหลือหรือการปรับท่าทางโดยตรงจากผู้ฝึกสอน
              ด้วยเหตุนี้ สมาชิกจึงควรฝึกโยคะด้วยความระมัดระวัง ไม่ประมาท
              และไม่ฝืนปฏิบัติตามท่าฝึกเกินขีดความสามารถของตนเอง ทั้งนี้
              เนื่องจากสมาชิกแต่ละท่านมีสภาพร่างกายและความสามารถในการฝึกโยคะที่แตกต่างกัน
            </Paragraph>

            <Alert
              message="ข้อสำคัญเกี่ยวกับความรับผิดชอบ"
              description="ในวันที่เข้าฝึกโยคะนี้สมาชิกตกลงและรับรองว่าได้แจ้งข้อมูลเกี่ยวกับสุขภาพของตนเองอย่างครบถ้วนต่อไอแอมป์โยคะแล้ว และได้ปรึกษาแพทย์และได้รับอนุญาตให้สามารถเข้าร่วมการฝึกโยคะได้อย่างปลอดภัย ตลอดจนรับทราบว่าการฝึกโยคะอาจก่อให้เกิดอาการบาดเจ็บหรือผลกระทบต่อสุขภาพได้ สมาชิกยินยอมรับความเสี่ยงภายใต้การฝึกอย่างระมัดระวัง และในกรณีที่ไม่ได้เกิดจากความบกพร่องของไอแอมป์โยคะ นอกจากนี้ สมาชิกจะไม่ฝืนฝึกในท่าที่เกินขีดความสามารถของตน และจะหยุดการฝึกทันทีหากรู้สึกเจ็บปวด เวียนศีรษะ หรือมีอาการผิดปกติใดๆ ในระหว่างการฝึก โดยไม่เรียกร้องหรือถือโทษต่อไอแอมป์โยคะ ครูฝึก หรือผู้เกี่ยวข้อง ไอแอมป์โยคะขอสงวนสิทธิ์ไม่รับผิดชอบต่อความเสียหายหรือผลกระทบที่ไม่ได้เกิดจากความผิดของไอแอมป์โยคะ"
              type="warning"
              showIcon
              style={{ marginTop: "16px" }}
            />

            <Paragraph
              style={{
                marginTop: "16px",
                padding: "16px",
                backgroundColor: "#f6f8fa",
                borderRadius: "6px",
              }}
            >
              สมาชิกแต่ละท่านตกลงรับผิดในความเสียหายหรือผลกระทบที่เกิดจากการฝ่าฝืน
              ละเลย หรือไม่ปฏิบัติตามข้อกำหนดของสมาชิกเอง
              <Text strong style={{ color: "#d4380d" }}>
                {" "}
                ไอแอมป์โยคะจะรับผิดเฉพาะความเสียหายหรือผลกระทบที่เกิดจากการกระทำโดยเจตนาของไอแอมป์โยคะเท่านั้น
              </Text>
            </Paragraph>

            <Paragraph
              style={{
                marginTop: "16px",
                textAlign: "center",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              ท้ายที่สุดไอแอมป์โยคะมีความคาดหวังอย่างยิ่งว่าสมาชิกทุกท่านจะปฏิบัติตามข้อกำหนดและคำแนะนำข้างต้นอย่างเคร่งครัด
              และได้รับประสบการณ์ที่ดีและความสุขจากการฝึกโยคะกับเรา
            </Paragraph>
          </Space>
        </Card>

        {/* Privacy Consent Section */}
        <Card
          title="หนังสือให้ความยินยอมเก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคล"
          style={{ marginBottom: "24px" }}
        >
          <Paragraph style={{ marginBottom: "16px" }}>
            <Text strong>สำหรับผู้เข้าเรียนไอแอมป์โยคะ ไอแอมป์โยคะ</Text>
          </Paragraph>

          <Form.Item
            label="ชื่อ-นามสกุล"
            name="fullName"
            rules={[{ required: true, message: "กรุณากรอกชื่อ-นามสกุล" }]}
          >
            <Input placeholder="กรุณากรอกชื่อ-นามสกุล" size="large" />
          </Form.Item>

          <Paragraph style={{ marginBottom: "16px" }}>
            ข้าพเจ้าตกลงให้ความยินยอมแก่ไอแอมป์โยคะ ไอแอมป์โยคะ ในการเก็บรวบรวม
            ใช้ หรือเปิดเผยข้อมูลส่วนบุคคล ได้แก่ ชื่อ-สกุล เพศ วันเดือนปีเกิด
            อายุ ภาพถ่ายหรือวีดีโอ ข้อมูลการติดต่อ เช่น ที่อยู่ หมายเลขโทรศัพท์
            หรือช่องทางติดต่ออิเล็กทรอนิกส์อื่น และข้อมูลการเข้าเรียน เช่น
            ข้อมูลการลงทะเบียน เวลาที่เข้าร่วม การตอบแบบสอบถาม
            แบบประเมินของข้าพเจ้า ภายใต้วัตถุประสงค์ดังต่อไปนี้
          </Paragraph>

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
                  รวมถึงการจัดส่งเอกสารหรือข้อมูลอื่นใดที่เกี่ยวข้องกับกิจกรรมของไอแอมป์โยคะ
                  ให้แก่ผู้เรียน (จำเป็น)
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
                  5. เพื่อใช้ในการประชาสัมพันธ์กิจกรรมของไอแอมป์โยคะ
                  ไม่ว่าจะผ่านสื่ออิเล็กทรอนิกส์ เช่น เว็บไซต์ เฟซบุ๊ก
                  หรือแพลตฟอร์มออนไลน์อื่นใด
                  รวมถึงการประชาสัมพันธ์ในรูปแบบสื่อสิ่งพิมพ์ แผ่นพับ
                  ป้ายประชาสัมพันธ์ หรือสื่อมัลติมีเดีย
                  โดยมีวัตถุประสงค์เพื่อแสดงภาพรวมของกิจกรรมและเสริมสร้างภาพลักษณ์ของไอแอมป์โยคะ
                  ต่อสาธารณชน (ไม่บังคับ)
                </Text>
              </Checkbox>
            </div>
          </Space>

          <Paragraph
            style={{ marginTop: "16px", fontSize: "14px", color: "#666" }}
          >
            โดยผู้เรียนสามารถเพิกถอนความยินยอมที่ให้ไว้แก่ไอแอมป์โยคะ
            ได้โดยการแจ้งให้ไอแอมป์โยคะ ทราบผ่านช่องทางการติดต่อที่กำหนด ทั้งนี้
            การเพิกถอนคำยินยอมจะไม่ส่งผลต่อการเก็บรวบรวม ใช้
            หรือเปิดเผยข้อมูลส่วนบุคคล ที่ได้ให้ความยินยอมไปแล้วก่อนมีการเพิกถอน
          </Paragraph>

          <Paragraph
            style={{ marginTop: "16px", fontSize: "14px", color: "#666" }}
          >
            ผู้เรียนสามารถศึกษารายละเอียดเกี่ยวกับนโยบายการประมวลผลข้อมูลส่วนบุคคล
            สิทธิของเจ้าของข้อมูลส่วนบุคคล
            ระยะเวลาในการเก็บรวบรวมข้อมูลส่วนบุคคล
            ประเภทของบุคคลหรือหน่วยงานซึ่งข้อมูลส่วนบุคคลที่เก็บรวบรวมอาจจะถูกเปิดเผย
            มาตรการรักษาความมั่นคงปลอดภัย
            หรือข้อมูลอื่นใดที่เกี่ยวข้องกับนโยบายคุ้มครองข้อมูลส่วนบุคคลได้จากนโยบายว่าด้วยสิทธิและการคุ้มครองข้อมูลส่วนบุคคลไอแอมป์โยคะ
            ไอแอมป์โยคะ ซึ่งไอแอมป์โยคะ
            ได้จัดทำเพื่อให้สอดคล้องกับพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ.
            2562 และเผยแพร่ข้อมูลดังกล่าวผ่านช่องทางเพจเฟซบุ๊ก "ไอแอมป์โยคะ I'
            amp yoqa"
          </Paragraph>
        </Card>

        {/* Contact Information */}
        <Card style={{ marginBottom: "24px", backgroundColor: "#f0f2f5" }}>
          <Title level={5} style={{ marginBottom: "16px" }}>
            ช่องทางติดต่อสอบถาม
          </Title>
          <Paragraph>
            ผู้เรียนสามารถติดต่อไอแอมป์โยคะ
            เพื่อสอบถามรายละเอียดเพิ่มเติมหรือใช้สิทธิตามกฎหมายได้ผ่านช่องทางต่อไปนี้
          </Paragraph>
          <Space direction="vertical">
           
            <Text strong style={{ color: "#1890ff" }}>
              Email: iampyoqa@gmail.com
            </Text>
          </Space>
        </Card>

        {/* Final Declaration */}
        {/* <Card style={{ marginBottom: "24px", borderColor: "#722ed1" }}>
          <Paragraph style={{ fontSize: "14px", lineHeight: "1.6" }}>
            ข้าพเจ้า นาย/นาง/นางสาว _____________________
            ผู้แทนโดยชอบธรรมของเจ้าของข้อมูลส่วนบุคคล
            ได้อ่านและเข้าใจข้อกำหนดและเงื่อนไขในการประมวลผลข้อมูลส่วนบุคคลซึ่งระบุไว้ข้างต้นอย่างครบถ้วนและชัดเจนแล้ว
            จึงให้ความยินยอมแก่ไอแอมป์โยคะ ในการเก็บรวบรวม ใช้
            และเปิดเผยข้อมูลส่วนบุคคลของข้าพเจ้า ตลอดจนการบันทึกภาพถ่าย
            ภาพวิดีโอ
            และข้อมูลส่วนบุคคลอื่นใดที่ปรากฏอยู่ในภาพถ่ายหรือวิดีโอดังกล่าว
            และอนุญาตให้นำภาพถ่าย วิดีโอ
            หรือเนื้อหาดังกล่าวเผยแพร่ผ่านสื่ออิเล็กทรอนิกส์หรือช่องทางประชาสัมพันธ์ต่าง
            ๆ ไม่ว่าจะเป็นในที่สาธารณะหรือสถานที่อื่นใด ทั้งนี้
            ข้าพเจ้าจะไม่เรียกร้องสิทธิ ค่าตอบแทน หรือสินไหมทดแทนใด ๆ
            อันเนื่องมาจากการนำข้อมูลหรือภาพดังกล่าวไปใช้เพื่อวัตถุประสงค์ที่ระบุไว้ในหนังสือให้ความยินยอมฉบับนี้
          </Paragraph>
        </Card> */}

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
