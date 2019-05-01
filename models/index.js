const mongoose = require("mongoose");
const config = require("../config");
const log = require("../recorder").log;

require("./users");
require("./articles");
require("./counters");
require("./comments");
require("./replies");

mongoose.connect(config.dbUrl, {
  useNewUrlParser: true,
  config: {
    autoIndex: true
  }
});
const conn = mongoose.connection;

conn.on("connected", () => {
  log("success", `'connected to ${config.dbUrl}' success.`);
});
conn.on("error", e => {
  log("error", e);
});

module.exports = {
  Counters: mongoose.model("Counters"),
  Users: mongoose.model("Users"),
  Articles: mongoose.model("Articles"),
  Comments: mongoose.model("Comments"),
  Replies: mongoose.model("Replies")
};