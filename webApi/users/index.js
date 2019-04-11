const router = require("express").Router();
const eventProxy = require("eventproxy");
const passCipher = require("../../utils").passCipher;
const Users = require("../../models").Users;
const config = require("../../app.config");
const log = require("../../recorder").log;

router.post("/register", function(req, res, next) {
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

router.post("/login", function(req, res, next) {
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
    req.session.token = data;
    req.session.save();
    res.json({
      code: 0,
      status: "success",
      msg: "登陆成功",
      result: data
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

router.post("/logout", function(req, res, next) {
  req.session.destroy();
  res.json({
    code: 0,
    status: "success",
    msg: "ok"
  });
});

router.get("/get", function(req, res, next) {
  let token = req.session.token;
  let { id, role } = token ? token : {};
  let serachParams = req.query;
  const ep = new eventProxy();
  ep.on("suc", function(data) {
    data.password = null;
    res.json({
      code: 0,
      status: "success",
      result: data
    });
  });

  ep.on("error", function(err) {
    err.tip = "获取用户信息失败";
    return next(err);
  });

  // 管理员查询信息
  if (Object.keys(serachParams).length && role === "admin") {
    Users.find(serachParams, ep.done("suc"));
  } else if (id) {
    // 查询当前登录用户的信息
    Users.findOne({ id }, ep.done("suc"));
  } else {
    res.json({
      code: 1,
      status: "success",
      result: null,
      msg: "该用户未登录"
    });
  }

  Users.findOne();
});

module.exports = router;
