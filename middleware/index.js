const commonMid = require("./common");
const usersMid = require("./users");
const articlesMid = require("./articles");

var midware = {
  register: function(app) {
    Object.keys(commonMid).forEach(name => {
      app.use(commonMid[name]);
    });

    Object.keys(usersMid).forEach(name => {
      app.use(usersMid[name]);
    });

    Object.keys(articlesMid).forEach(name => {
      app.use(articlesMid[name]);
    });
  }
};
module.exports = exports = midware;
