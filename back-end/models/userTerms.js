const mongoose = require("mongoose");

const userTermsSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  accepted: {
    type: Boolean,
    default: false,
  },

  acceptedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("UserTerms", userTermsSchema);
