const mongoose = require("mongoose");

const butterflySchema = new mongoose.Schema({
  name: {
    type: String,
  },
  sinhalaName: {
    type: String,
  },
  scientificName: {
    type: String,
  },
  family: {
    type: String,
  },
  img: {
    type: String,
  },
});

module.exports = mongoose.model("Butterfly", butterflySchema);
