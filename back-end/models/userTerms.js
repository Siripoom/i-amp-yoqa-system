const mongoose = require("mongoose");

const userTermsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  accepted: {
    type: Boolean,
    default: false,
  },
  agreement1: {
    type: Boolean,
    default: false,
  },
  agreement2: { type: Boolean, default: false },
  agreement3: { type: Boolean, default: false },
  agreement4: { type: Boolean, default: false },
  agreement5: { type: Boolean, default: false },
  acceptedAt: {
    type: Date,
    default: null,
  },
});

module.export = mongoose.model("UserTerms", userTermsSchema);
