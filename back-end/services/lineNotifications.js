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

const sendPushMessage = async ({ lineUserId, messages, client = createLineClient() }) => {
  if (!lineUserId) return { skipped: true, reason: "not_linked" };
  await client.pushMessage({ to: lineUserId, messages: messages.slice(0, 5) });
  return { accepted: true };
};

module.exports = { createLineClient, reservationConfirmationMessage, sendPushMessage };
