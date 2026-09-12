class LineMemberIdentityError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "LineMemberIdentityError";
    this.code = code;
    this.status = status;
  }
}

const findOrCreateVerifiedLineMember = async ({ MemberModel, identity }) => {
  const linkedMember = await MemberModel.findOne({
    line_user_id: identity.subject,
  });
  if (linkedMember) return linkedMember;

  const legacyCandidate = await MemberModel.findOne({
    username: identity.subject,
    line_user_id: { $exists: false },
  });
  if (legacyCandidate) {
    throw new LineMemberIdentityError(
      "LINE_LEGACY_ACCOUNT_REVIEW_REQUIRED",
      "This LINE account must be reviewed before it can be migrated",
      409
    );
  }

  const member = new MemberModel({
    line_user_id: identity.subject,
    first_name: identity.displayName || "LINE Member",
    role_id: "Member",
    userTerms: false,
  });
  await member.save();
  return member;
};

const legacyLineUserIdPattern = /^U[0-9a-f]{32}$/i;

const approveLegacyLineMember = async ({ MemberModel, memberId }) => {
  const member = await MemberModel.findById(memberId);
  if (!member) {
    throw new LineMemberIdentityError(
      "LINE_LEGACY_ACCOUNT_NOT_FOUND",
      "Legacy LINE member was not found",
      404
    );
  }
  if (member.line_user_id) return member;

  const isEligible =
    member.role_id === "Member" &&
    legacyLineUserIdPattern.test(member.username || "") &&
    !member.email &&
    !member.password;
  if (!isEligible) {
    throw new LineMemberIdentityError(
      "LINE_LEGACY_ACCOUNT_NOT_ELIGIBLE",
      "Member does not match the legacy LINE-first account shape",
      422
    );
  }

  const conflictingMember = await MemberModel.findOne({
    line_user_id: member.username,
  });
  if (
    conflictingMember &&
    String(conflictingMember._id) !== String(member._id)
  ) {
    throw new LineMemberIdentityError(
      "LINE_IDENTITY_CONFLICT",
      "LINE identity is already connected to another member",
      409
    );
  }

  member.line_user_id = member.username;
  await member.save();
  return member;
};

module.exports = {
  approveLegacyLineMember,
  LineMemberIdentityError,
  findOrCreateVerifiedLineMember,
};
