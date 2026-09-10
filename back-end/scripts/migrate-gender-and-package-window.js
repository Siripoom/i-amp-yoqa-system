require("dotenv").config();
const mongoose = require("mongoose");
const Class = require("../models/class");
const Order = require("../models/order");
const User = require("../models/user");
const {
  PACKAGE_ACTIVATION_DAYS,
  getActivationExpiry,
} = require("../utils/packageExpiry");

const applyChanges = process.argv.includes("--apply");
async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI);

  const classesMissingGender = await Class.countDocuments({
    allowed_gender: { $exists: false },
  });
  if (applyChanges && classesMissingGender > 0) {
    await Class.updateMany(
      { allowed_gender: { $exists: false } },
      { $set: { allowed_gender: "all" } }
    );
  }

  const approvedOrders = await Order.find({
    order_type: "product",
    status: "อนุมัติ",
  }).lean();

  const latestOrderByUser = new Map();
  for (const order of approvedOrders) {
    const userId = String(order.user_id);
    const effectiveDate = order.approval_date || order.updatedAt || order.order_date;
    const previous = latestOrderByUser.get(userId);
    const previousDate = previous &&
      (previous.approval_date || previous.updatedAt || previous.order_date);
    if (
      effectiveDate &&
      (!previousDate || new Date(effectiveDate) > new Date(previousDate))
    ) {
      latestOrderByUser.set(userId, order);
    }
  }

  const pendingUsers = await User.find({
    _id: { $in: [...latestOrderByUser.keys()] },
    remaining_session: { $gt: 0 },
    first_used_date: null,
  }).lean();

  const sourceCounts = { approval_date: 0, updatedAt: 0, order_date: 0 };
  let packageUpdates = 0;
  let skipped = 0;
  for (const user of pendingUsers) {
    const order = latestOrderByUser.get(String(user._id));
    const source = order.approval_date
      ? "approval_date"
      : order.updatedAt
        ? "updatedAt"
        : order.order_date
          ? "order_date"
          : null;
    if (!source) {
      skipped += 1;
      continue;
    }

    sourceCounts[source] += 1;
    const sessionsExpiryDate = getActivationExpiry(order[source]);
    if (
      !user.sessions_expiry_date ||
      new Date(user.sessions_expiry_date).getTime() !== sessionsExpiryDate.getTime()
    ) {
      packageUpdates += 1;
      if (applyChanges) {
        await User.updateOne(
          { _id: user._id, first_used_date: null },
          { $set: { sessions_expiry_date: sessionsExpiryDate } }
        );
      }
    }
  }

  console.log({
    mode: applyChanges ? "apply" : "dry-run",
    classesMissingGender,
    packageUpdates,
    skipped,
    dateSources: sourceCounts,
    activationDays: PACKAGE_ACTIVATION_DAYS,
  });
}

main()
  .catch((error) => {
    console.error("Migration failed", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
