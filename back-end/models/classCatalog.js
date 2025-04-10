const mongoose = require("mongoose");

const classCatalogSchema = new mongoose.Schema(
  {
    classname: { type: String, required: true },
    image: { type: String, required: false },
    description: { type: String, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClassCatalog", classCatalogSchema);
