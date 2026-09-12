const line = require("@line/bot-sdk");

const createLineClient = ({ channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN } = {}) => {
  if (!channelAccessToken) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
  return new line.messagingApi.MessagingApiClient({ channelAccessToken });
};

const reservationConfirmationMessage = ({ className, startTime, endTime, remaining }) => ({
  type: "flex",
  altText: `ยืนยันการจองคลาส ${className}`,
  contents: {
    type: "bubble",
    body: { type: "box", layout: "vertical", contents: [
      { type: "text", text: "จองคลาสสำเร็จ", weight: "bold", size: "xl", color: "#2E7D32" },
      { type: "text", text: className, weight: "bold", margin: "md", wrap: true },
      { type: "text", text: `วันเวลา: ${startTime}${endTime ? ` - ${endTime}` : ""}`, margin: "sm", wrap: true },
      { type: "separator", margin: "md" },
      { type: "text", text: "หักสิทธิ์แล้ว 1 คลาส", margin: "md" },
      { type: "text", text: `สิทธิ์คงเหลือ: ${remaining} คลาส`, weight: "bold", margin: "sm" },
    ] },
  },
});

const classReminderMessage = ({ className, startTime }) => ({
  type: "flex", altText: `เตือนเข้าเรียนคลาส ${className}`,
  contents: { type: "bubble", body: { type: "box", layout: "vertical", contents: [
    { type: "text", text: "เตือนเข้าเรียน", weight: "bold", size: "xl", color: "#1565C0" },
    { type: "text", text: className, weight: "bold", margin: "md", wrap: true },
    { type: "text", text: `เริ่มเวลา: ${startTime}`, margin: "sm", wrap: true },
  ] } },
});

const reservationCancellationMessage = ({ className, startTime, remaining }) => ({
  type: "flex", altText: `ยกเลิกการจองคลาส ${className}`,
  contents: { type: "bubble", body: { type: "box", layout: "vertical", contents: [
    { type: "text", text: "ยกเลิกการจองแล้ว", weight: "bold", size: "xl", color: "#C62828" },
    { type: "text", text: className || "คลาสโยคะ", weight: "bold", margin: "md", wrap: true },
    ...(startTime ? [{ type: "text", text: `เวลาเดิม: ${startTime}`, margin: "sm", wrap: true }] : []),
    { type: "separator", margin: "md" },
    { type: "text", text: "คืนสิทธิ์แล้ว 1 คลาส", margin: "md" },
    { type: "text", text: `สิทธิ์คงเหลือ: ${remaining} คลาส`, weight: "bold", margin: "sm" },
  ] } },
});

const classChangeMessage = ({ className, startTime, instructor, location }) => ({
  type: "flex", altText: `มีการเปลี่ยนแปลงคลาส ${className}`,
  contents: { type: "bubble", body: { type: "box", layout: "vertical", contents: [
    { type: "text", text: "คลาสมีการเปลี่ยนแปลง", weight: "bold", size: "xl", color: "#EF6C00" },
    { type: "text", text: className, weight: "bold", margin: "md", wrap: true },
    ...(startTime ? [{ type: "text", text: `วันเวลาใหม่: ${startTime}`, margin: "sm", wrap: true }] : []),
    ...(instructor ? [{ type: "text", text: `ผู้สอน: ${instructor}`, margin: "sm", wrap: true }] : []),
    ...(location ? [{ type: "text", text: `สถานที่: ${location}`, margin: "sm", wrap: true }] : []),
  ] } },
});

const sendPushMessage = async ({ lineUserId, messages, client = createLineClient() }) => {
  if (!lineUserId) return { skipped: true, reason: "not_linked" };
  await client.pushMessage({ to: lineUserId, messages: messages.slice(0, 5) });
  return { accepted: true };
};

module.exports = { createLineClient, reservationConfirmationMessage, classReminderMessage, reservationCancellationMessage, classChangeMessage, sendPushMessage };
