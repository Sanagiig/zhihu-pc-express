const router = require("express").Router();
const eventProxy = require("eventproxy");
const passCipher = require("../../utils").passCipher;
const Users = require("../../models").Users;
const config = require("../../app.config");
const log = require("../../recorder").log;

router.all("/register", function(req, res, next) {
  const ep = new eventProxy();
  var loginName = req.body.loginName;
  var password = req.body.password;
  var id = 1;

  ep.on("checkPass", function() {
    Users.count({}).exec(ep.done("count"));
  });
  ep.on("checkBlock", function(data) {
    res.json({
      code: 0,
      status: "failure",
      msg: "该用户名已经存在"
    });
  });
  ep.on("count", function(count) {
    if (count) id = count + 1;
    new Users({
      id,
      loginName,
      password: passCipher(password)
    }).save(ep.done("register"));
  });
  ep.on("register", function(data) {
    res.json({
      code: 0,
      status: "success",
      msg: "注册成功"
    });
  });
  ep.on("error", function(err) {
    next(err);
  });

  if (!loginName || !password) {
    ep.throw(new TypeError("账号密码不符合要求"));
  } else {
    Users.findOne({
      loginName
    }).exec(function(err, data) {
      if (err) {
        err.tip = "账号检测异常";
        ep.throw(err);
        return;
      }

      if (!data) {
        ep.emit("checkPass");
      } else {
        ep.emit("checkBlock");
      }
    });
  }
});

router.all("/login", function(req, res, next) {
  const ep = new eventProxy();
  var loginName = req.body.loginName;
  var password = passCipher(req.body.password || "");

  ep.on("unMatch", function() {
    res.json({
      code: 1,
      status: "failure",
      msg: "用户名或密码不正确"
    });
  });
  ep.on("login", function(data) {
    let { _id, id, loginName, role } = data;
    req.session.token = {
      _id,
      id,
      loginName,
      role
    };
    req.session.save();
    res.json({
      code: 0,
      status: "success",
      msg: "登陆成功"
    });
  });
  ep.on("error", function(err) {
    next(err);
  });

  if (!loginName || !password) {
    var err = new Error("用户名或密码不符合要求");
    err.tip = "用户名或密码不符合要求";
    return next(err);
  }

  Users.findOne({
    loginName,
    password
  }).exec(function(err, data) {
    if (err) {
      err.tip = "账号密码检测异常";
      return ep.throw(err);
    }

    if (data) {
      ep.emit("login", data);
    } else {
      ep.emit("unMatch");
    }
  });
});

module.exports = router;
