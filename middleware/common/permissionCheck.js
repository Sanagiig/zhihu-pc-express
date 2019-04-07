const config = require("../../app.config");
const loginList = config.needLoginUrl;
const searchList = config.limitSearchUrl;

// 检测url 是否匹配
function _urlCheck(pattern, path) {
  return (
    (typeof pattern === "string" && path.indexOf(pattern) === 0) ||
    (pattern instanceof RegExp && pattern.test(path))
  );
}
function loginCheck(req, res, next) {
  var err = null;
  var path = req.path;
  var token = req.session.token;

  if (!token) {
    for (var i = 0, len = loginList.length; i < len; i++) {
      var pattern = loginList[i];
      if (_urlCheck(patter, path)) {
        err = new Error("请先登陆再访问相关内容");
        err.tip = "请先登陆再访问相关内容";
        err.code = 403;
        break;
      }
    }
  }
  next(err);
}

function searchLimit(req, res, next) {
  var err = null;
  var path = req.path;
  var token = req.session.token;
  var role = token ? token.role : null;
  if (role !== "admin") {
    for (var i = 0, len = searchList.length; i < len; i++) {
      var pattern = searchList[i];
      if (_urlCheck(pattern, path)) {
        req.query.isDelete = false;
        req.body.isDelete = false;
        break;
      }
    }
  }
  next(err);
}

module.exports = {
  loginCheck,
  searchLimit
};
