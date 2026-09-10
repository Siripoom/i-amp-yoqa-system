const MEMBER_REQUIRED_FIELDS = [
  "gender",
  "address",
  "has_medical_condition",
];

const getMissingMemberProfileFields = (user) => {
  if (!user || user.role_id !== "Member") return [];

  const missing = MEMBER_REQUIRED_FIELDS.filter((field) => {
    if (field === "has_medical_condition") {
      return typeof user[field] !== "boolean";
    }
    return !user[field] || !String(user[field]).trim();
  });

  if (
    user.has_medical_condition === true &&
    (!user.medical_condition_details ||
      !String(user.medical_condition_details).trim())
  ) {
    missing.push("medical_condition_details");
  }

  return missing;
};

const normalizeMedicalProfile = (data) => {
  const normalized = { ...data };
  if (normalized.address !== undefined) {
    normalized.address = String(normalized.address).trim();
  }
  if (normalized.medical_condition_details !== undefined) {
    normalized.medical_condition_details = normalized.medical_condition_details
      ? String(normalized.medical_condition_details).trim()
      : null;
  }
  if (normalized.has_medical_condition === false) {
    normalized.medical_condition_details = null;
  }
  return normalized;
};

const isGenderAllowed = (userGender, allowedGender = "all") =>
  allowedGender === "all" || userGender === allowedGender;

module.exports = {
  getMissingMemberProfileFields,
  normalizeMedicalProfile,
  isGenderAllowed,
};
