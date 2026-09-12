const NotificationSettings = require("../models/notificationSettings");
const Outbox = require("../models/lineNotificationOutbox");

const adminOnly = (req, res) => {
  if (!["Admin", "SuperAdmin"].includes(req.user?.role)) {
    res.status(403).json({ message: "Access denied" });
    return false;
  }
  return true;
};

exports.getSettings = async (req, res) => {
  if (!adminOnly(req, res)) return;
  const settings = await NotificationSettings.findOneAndUpdate(
    { key: "default" }, {}, { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ settings });
};

exports.updateSettings = async (req, res) => {
  if (!adminOnly(req, res)) return;
  const allowed = ["transactional_enabled", "reminders_enabled", "reminder_offset_hours", "quiet_hours_start", "quiet_hours_end"];
  const update = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
  if (update.reminder_offset_hours !== undefined && (!Number.isInteger(update.reminder_offset_hours) || update.reminder_offset_hours < 1 || update.reminder_offset_hours > 168)) {
    return res.status(422).json({ code: "INVALID_REMINDER_OFFSET", message: "reminder_offset_hours must be between 1 and 168" });
  }
  const settings = await NotificationSettings.findOneAndUpdate(
    { key: "default" }, update, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ settings });
};

exports.getOutboxSummary = async (req, res) => {
  if (!adminOnly(req, res)) return;
  const summary = await Outbox.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  res.json({ summary: Object.fromEntries(summary.map(({ _id, count }) => [_id, count])) });
};
