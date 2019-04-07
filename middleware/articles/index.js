const eventProxy = require("eventproxy");
const Articles = require("../../models").Articles;
module.exports = {
  uploadCheck(req, res, next) {
    let { id } = req.body;
    let { _id, role } = req.session.token ? req.session.token : {};
    const ep = new eventProxy();
    if (req.path !== "/api/articles/upload") return next();
    ep.on("check", function(data) {
      var err = null;
      if (data.authorId !== _id || role === "admin") {
        err = new Error("没有权限编辑该文章");
        err.tip = "没有权限编辑该文章";
      }
      next(err);
    });
    ep.on("error", function(e) {
      next(e);
    });
    if (id) {
      Articles.find({ id }, eq.done("check"));
    } else {
      next();
    }
  }
};
