const mongoose = require("mongoose");
const config = require("../app.config");
const log = require("../recorder").log;

require("./users");
require("./articles");
require("./counters");

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
  Users: mongoose.model("Users"),
  Articles: mongoose.model("Articles"),
  Counters: mongoose.model("Counters")
};
