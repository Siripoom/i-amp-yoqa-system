import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Checkbox, Descriptions, Input, message, Modal, Select, Space, Table, Tag } from "antd";
import { approveLegacyLineMember, getLegacyLineMembers } from "../services/userService";

const errorMessages = {
  LINE_IDENTITY_CONFLICT: "พบสมาชิกอื่นใช้ LINE ID เดียวกัน กรุณาตรวจสอบบัญชีซ้ำก่อน",
  LINE_REVIEW_STALE: "ข้อมูลสมาชิกเปลี่ยนแล้ว กรุณาปิดหน้าต่างและโหลดรายการใหม่",
  LINE_LEGACY_ACCOUNT_NOT_ELIGIBLE: "บัญชีนี้ถูกลบหรือไม่เข้าเงื่อนไขสมาชิก LINE เดิม",
  LINE_LEGACY_ACCOUNT_NOT_FOUND: "ไม่พบบัญชีสมาชิกนี้แล้ว",
  LINE_REVIEW_REQUIRED: "กรุณายืนยันเจ้าของบัญชีและระบุวิธีตรวจสอบอย่างน้อย 5 ตัวอักษร",
};
const nameOf = (member) => [member.first_name, member.last_name].filter(Boolean).join(" ") || "ไม่ระบุชื่อ";

export default function LegacyLineMembers() {
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ members: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setLoadError(false);
    try {
      const result = await getLegacyLineMembers({ status, page, search });
      if (id === requestId.current) setData(result);
    } catch {
      if (id === requestId.current) { setLoadError(true); setData({ members: [], total: 0 }); }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [status, page, search]);
  useEffect(() => {
    const requests = requestId;
    load();
    return () => { requests.current++; };
  }, [load]);

  const approve = async () => {
    if (!confirmed || note.trim().length < 5 || saving) return;
    setSaving(true);
    try {
      await approveLegacyLineMember(selected._id, {
        expectedLineUserId: selected.username, confirmed: true, note: note.trim(),
      });
      message.success("เชื่อมต่อ LINE กับสมาชิกเดิมแล้ว ให้สมาชิกลองเข้าสู่ระบบอีกครั้ง");
      setSelected(null);
      await load();
    } catch (error) {
      message.error(errorMessages[error?.response?.data?.code] || "เชื่อมต่อไม่สำเร็จ กรุณาโหลดรายการใหม่แล้วลองอีกครั้ง");
    } finally { setSaving(false); }
  };

  const openReview = (member) => { setSelected(member); setConfirmed(false); setNote(""); };
  const columns = [
    { title: "สมาชิก", key: "member", render: (_, member) => <><strong>{nameOf(member)}</strong><div>{member.nickname || ""}</div><div>รหัส: {member.code || "—"}</div></> },
    { title: "ติดต่อ", key: "contact", render: (_, member) => <><div>{member.email || "ไม่มีอีเมล"}</div><div>{member.phone || "ไม่มีเบอร์โทร"}</div></> },
    { title: "สถานะ", key: "status", render: (_, member) => <Tag color={member.line_user_id ? "green" : "orange"}>{member.line_user_id ? "เชื่อมต่อแล้ว" : "รอตรวจสอบ"}</Tag> },
    { title: "จัดการ", key: "action", render: (_, member) => <Button onClick={() => openReview(member)}>{member.line_user_id ? "ดูข้อมูล" : "ตรวจสอบและเชื่อมต่อ"}</Button> },
  ];
  const linked = Boolean(selected?.line_user_id);
  return <Space direction="vertical" size="middle" style={{ width: "100%" }}>
    <Alert type="info" showIcon message="แก้ปัญหาสมาชิก LINE เดิมเข้าสู่ระบบไม่ได้"
      description="ตรวจสอบเจ้าของบัญชีกับสมาชิกก่อนเชื่อมต่อ ระบบจะใช้บัญชีสมาชิกเดิมและรักษาประวัติการจองกับคลาสคงเหลือไว้ รายการนี้ไม่รวมบัญชีที่ถูกลบ" />
    <Space wrap>
      <Input.Search aria-label="ค้นหาสมาชิก LINE" placeholder="ชื่อ รหัสสมาชิก อีเมล หรือเบอร์โทร" maxLength={100} allowClear
        onSearch={value => { setSearch(value.trim()); setPage(1); }} style={{ width: 300, maxWidth: "100%" }} />
      <Select aria-label="สถานะบัญชี LINE" value={status} style={{ width: 160 }}
        options={[{ value: "pending", label: "รอตรวจสอบ" }, { value: "linked", label: "เชื่อมต่อแล้ว" }]}
        onChange={value => { setStatus(value); setPage(1); }} />
      <Button onClick={load} loading={loading}>โหลดใหม่</Button>
    </Space>
    {loadError && <Alert type="error" showIcon message="โหลดรายการบัญชี LINE ไม่สำเร็จ กรุณากดโหลดใหม่" />}
    <Table rowKey="_id" columns={columns} dataSource={data.members} loading={loading} scroll={{ x: 650 }}
      locale={{ emptyText: "ไม่พบบัญชีในรายการนี้" }}
      pagination={{ current: page, pageSize: 20, total: data.total, showSizeChanger: false, onChange: setPage }} />
    <Modal title={linked ? "ข้อมูลการเชื่อมต่อ LINE" : "ตรวจสอบและเชื่อมต่อบัญชี LINE"} open={Boolean(selected)}
      onCancel={() => { if (!saving) setSelected(null); }} closable={!saving} maskClosable={!saving}
      footer={linked ? <Button onClick={() => setSelected(null)}>ปิด</Button> : <Space>
        <Button disabled={saving} onClick={() => setSelected(null)}>ยกเลิก</Button>
        <Button type="primary" loading={saving} disabled={!confirmed || note.trim().length < 5} onClick={approve}>ยืนยันเชื่อมต่อ LINE</Button>
      </Space>}>
      {selected && <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Descriptions column={1} size="small" bordered items={[
          { key: "name", label: "ชื่อสมาชิก", children: nameOf(selected) },
          { key: "id", label: "รหัสสมาชิก / ID", children: `${selected.code || "—"} / ${selected._id}` },
          { key: "email", label: "อีเมล", children: selected.email || "—" },
          { key: "phone", label: "โทรศัพท์", children: selected.phone || "—" },
          { key: "line", label: "LINE ID เดิม", children: <span style={{ overflowWrap: "anywhere" }}>{selected.username}</span> },
          { key: "classes", label: "คลาสคงเหลือ", children: selected.remaining_session ?? "—" },
        ]} />
        {(selected.line_identity_reviews || []).map((review, index) => <Alert key={index} type="success"
          message={`ตรวจสอบเมื่อ ${new Date(review.reviewed_at).toLocaleString("th-TH")}`}
          description={<><div>ผู้ดำเนินการ: {review.actor_id}</div><div>{review.note}</div></>} />)}
        {linked && !selected.line_identity_reviews?.length && <Alert type="info" message="เชื่อมต่อก่อนเปิดใช้ระบบบันทึกการตรวจสอบ" />}
        {!linked && <>
          <Alert type="warning" showIcon message="ยืนยันว่า LINE และบัญชีสมาชิกนี้เป็นของคนเดียวกัน"
            description="สอบถามข้อมูลกับสมาชิกโดยตรง เช่น รหัสสมาชิกและเบอร์โทร อย่ายืนยันจากชื่อ LINE เพียงอย่างเดียว" />
          <label htmlFor="line-review-note">วิธีตรวจสอบเจ้าของบัญชี (5–500 ตัวอักษร)</label>
          <Input.TextArea id="line-review-note" value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={3}
            placeholder="เช่น ตรวจสอบรหัสสมาชิกและเบอร์โทรกับเจ้าของบัญชีแล้ว ไม่ใส่รหัสผ่านหรือ OTP" />
          <Checkbox checked={confirmed} onChange={e => setConfirmed(e.target.checked)}>ตรวจสอบแล้วว่าเป็นเจ้าของบัญชีเดียวกัน</Checkbox>
        </>}
      </Space>}
    </Modal>
  </Space>;
}
