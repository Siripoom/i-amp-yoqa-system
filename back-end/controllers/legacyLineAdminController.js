const Member = require("../models/user");
const { LineIdentityError } = require("../services/lineIdentity");

const pattern = /^U[0-9a-f]{32}$/i;
const fields = "_id first_name last_name nickname code email phone username line_user_id remaining_session line_identity_reviews";
const allowed = (req) => ["Admin", "SuperAdmin"].includes(req.user?.role);
const fail = (code, message, status) => { throw new LineIdentityError(code, message, status); };
const respondError = (res, error) => {
  if (error.code === 11000) return res.status(409).json({ code: "LINE_IDENTITY_CONFLICT", message: "LINE identity is already linked" });
  if (Number.isInteger(error.status)) return res.status(error.status).json({ code: error.code, message: error.message });
  return res.status(500).json({ message: "Unable to manage LINE membership" });
};

const createLegacyLineAdminHandlers = (MemberModel = Member) => ({
  async list(req, res) {
    if (!allowed(req)) return res.status(403).json({ message: "Access denied" });
    try {
      const status = req.query.status || "pending";
      const page = Number(req.query.page || 1);
      const search = String(req.query.search || "").trim();
      if (!["pending", "linked"].includes(status) || !Number.isSafeInteger(page) || page < 1 || page > 100000 || search.length > 100) {
        return res.status(400).json({ message: "Invalid query" });
      }
      const query = { role_id: "Member", deleted: { $ne: true }, username: pattern,
        line_user_id: status === "pending" ? { $in: [null, ""] } : { $regex: pattern } };
      if (search) {
        const term = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        query.$or = ["first_name", "last_name", "nickname", "code", "email", "phone", "username"].map(key => ({ [key]: term }));
      }
      const [members, total] = await Promise.all([
        MemberModel.find(query).select(fields).sort({ _id: 1 }).skip((page - 1) * 20).limit(20).lean(),
        MemberModel.countDocuments(query),
      ]);
      return res.json({ members, total, page, pageSize: 20 });
    } catch (error) { return respondError(res, error); }
  },
  async approve(req, res) {
    if (!allowed(req)) return res.status(403).json({ message: "Access denied" });
    try {
      const { expectedLineUserId, confirmed, note } = req.body || {};
      if (!/^[0-9a-f]{24}$/i.test(req.params.memberId) || confirmed !== true ||
          typeof expectedLineUserId !== "string" || !pattern.test(expectedLineUserId) ||
          typeof note !== "string" || note.trim().length < 5 || note.trim().length > 500) {
        return res.status(400).json({ code: "LINE_REVIEW_REQUIRED", message: "Confirm ownership and provide a review note" });
      }
      const member = await MemberModel.findById(req.params.memberId).select(fields + " role_id deleted");
      if (!member) fail("LINE_LEGACY_ACCOUNT_NOT_FOUND", "Member not found", 404);
      if (member.deleted || member.role_id !== "Member" || !pattern.test(member.username || "")) {
        fail("LINE_LEGACY_ACCOUNT_NOT_ELIGIBLE", "Member is not eligible", 422);
      }
      if (member.username !== expectedLineUserId || (member.line_user_id && member.line_user_id !== expectedLineUserId)) {
        fail("LINE_REVIEW_STALE", "Membership changed; refresh and review again", 409);
      }
      const conflict = await MemberModel.exists({ _id: { $ne: member._id }, $or: [
        { username: expectedLineUserId }, { line_user_id: expectedLineUserId },
      ] });
      if (conflict) fail("LINE_IDENTITY_CONFLICT", "Another member uses this LINE identity", 409);
      if (member.line_user_id === expectedLineUserId) return res.json({ member, alreadyLinked: true });
      const updated = await MemberModel.findOneAndUpdate({
        _id: member._id, username: expectedLineUserId, role_id: "Member", deleted: { $ne: true },
        line_user_id: { $in: [null, ""] },
      }, {
        $set: { line_user_id: expectedLineUserId },
        $push: { line_identity_reviews: { actor_id: req.user.userId, reviewed_at: new Date(), note: note.trim(), line_user_id: expectedLineUserId } },
      }, { new: true, runValidators: true }).select(fields);
      if (!updated) fail("LINE_REVIEW_STALE", "Membership changed; refresh and review again", 409);
      return res.json({ member: updated, alreadyLinked: false });
    } catch (error) { return respondError(res, error); }
  },
});
module.exports = { createLegacyLineAdminHandlers, ...createLegacyLineAdminHandlers() };
