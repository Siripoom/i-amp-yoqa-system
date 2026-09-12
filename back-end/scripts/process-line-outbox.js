require("dotenv").config();
const mongoose = require("mongoose");
const Outbox = require("../models/lineNotificationOutbox");
const { sendPushMessage, reservationConfirmationMessage, classReminderMessage, reservationCancellationMessage, classChangeMessage } = require("../services/lineNotifications");

const format = (value) => value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value)) : "ไม่ระบุเวลา";

async function processOnce() {
  const item = await Outbox.findOneAndUpdate(
    { status: "pending", next_attempt_at: { $lte: new Date() } },
    { $inc: { attempts: 1 } },
    { new: true, sort: { next_attempt_at: 1 } }
  );
  if (!item) return false;
  try {
    const p = item.payload || {};
    const messages = item.type === "reservation_confirmed"
      ? [reservationConfirmationMessage({ className: p.class_name, startTime: format(p.start_time), endTime: p.end_time ? format(p.end_time) : null, remaining: p.remaining })]
      : item.type === "class_reminder"
        ? [classReminderMessage({ className: p.class_name, startTime: format(p.start_time) })]
        : item.type === "reservation_cancelled"
          ? [reservationCancellationMessage({ className: p.class_name, startTime: p.start_time ? format(p.start_time) : null, remaining: p.remaining ?? 0 })]
          : item.type === "class_changed"
            ? [classChangeMessage({ className: p.class_name, startTime: p.start_time ? format(p.start_time) : null, instructor: p.instructor, location: p.location })]
          : [];
    if (!messages.length) throw new Error(`Unsupported notification type: ${item.type}`);
    await sendPushMessage({ lineUserId: item.line_user_id, messages });
    await Outbox.updateOne({ _id: item._id }, { $set: { status: "accepted", accepted_at: new Date(), last_error: null } });
  } catch (error) {
    const retry = item.attempts < 5;
    await Outbox.updateOne({ _id: item._id }, { $set: { status: retry ? "pending" : "failed", last_error: String(error.message).slice(0, 500), next_attempt_at: new Date(Date.now() + Math.min(item.attempts * 60_000, 24 * 60 * 60_000)) } });
  }
  return true;
}

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI).then(async () => {
    let stopping = false;
    const stop = async () => { stopping = true; await mongoose.disconnect(); process.exit(0); };
    process.on("SIGTERM", stop); process.on("SIGINT", stop);
    while (!stopping) {
      await processOnce();
      await new Promise((resolve) => setTimeout(resolve, Number(process.env.LINE_OUTBOX_POLL_MS) || 30_000));
    }
  }).catch((error) => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { processOnce };
