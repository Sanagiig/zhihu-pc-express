const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  _id: String,
  id: { type: Number, default: 0 }
});

module.exports = exports = mongoose.model("Counters", schema);
