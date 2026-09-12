const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Member = require("../models/user");
const {
  approveLegacyLineMember,
} = require("../services/lineMemberIdentity");

require("dotenv").config();

const run = async () => {
  const memberId = process.argv[2];
  if (!memberId) {
    throw new Error(
      "Usage: npm run migrate:line-identity -- <reviewed-member-id>"
    );
  }

  await connectDB();
  const member = await approveLegacyLineMember({
    MemberModel: Member,
    memberId,
  });
  console.log(`Migrated reviewed legacy LINE member ${member._id}`);
};

if (require.main === module) {
  run()
    .catch((error) => {
      console.error(`${error.code || "LINE_MIGRATION_FAILED"}: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.disconnect();
    });
}

module.exports = { run };
