const router = require("express").Router();
const eventProxy = require("eventproxy");
const passCipher = require("../../utils").passCipher;
const Users = require("../../models").Users;
const config = require("../../config");
const log = require("../../recorder").log;
const common = require("../common")
router.post("/register", function (req, res, next) {
  const ep = new eventProxy();
  var loginName = req.body.loginName;
  var password = req.body.password;
  var id = 1;

  ep.on("checkPass", function () {
    Users.count({}).exec(ep.done("count"));
  });
  ep.on("checkBlock", function (data) {
    res.json({
      code: 0,
      status: "failure",
      msg: "该用户名已经存在"
    });
  });
  ep.on("count", function (count) {
    if (count) id = count + 1;
    new Users({
      id,
      loginName,
      password: passCipher(password)
    }).save(ep.done("register"));
  });
  ep.on("register", function (data) {
    res.json({
      code: 0,
      status: "success",
      msg: "注册成功"
    });
  });
  ep.on("error", function (err) {
    next(err);
  });

  if (!loginName || !password) {
    ep.throw(new TypeError("账号密码不符合要求"));
  } else {
    Users.findOne({
      loginName
    }).exec(function (err, data) {
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

router.post("/login", function (req, res, next) {
  const ep = new eventProxy();
  var loginName = req.body.loginName;
  var password = passCipher(req.body.password || "");

  ep.on("unMatch", function () {
    res.json({
      code: 1,
      status: "failure",
      msg: "用户名或密码不正确"
    });
  });
  ep.on("login", function (data) {
    req.session.token = data;
    req.session.save();
    res.json({
      code: 0,
      status: "success",
      msg: "登陆成功",
      result: data
    });
  });
  ep.on("error", function (err) {
    next(err);
  });

  if (!loginName || !password) {
    var err = new Error("用户名或密码不符合要求");
    err.tip = "用户名或密码不符合要求";
    return next(err);
  }

  Users.findOneAndUpdate({
    loginName,
    password
  }, {
    lastLoginAt: Date.now()
  }).exec(function (err, data) {
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

// 登出
router.post("/logout", function (req, res, next) {
  req.session.destroy();
  res.json({
    code: 0,
    status: "success",
    msg: "ok"
  });
});

// 获取用户信息
router.get("/get", function (req, res, next) {
  let token = req.session.token;
  let {
    id,
    role
  } = token ? token : {};
  let serachParams = req.query;
  let fields;
  console.log('pa', req.query)
  const ep = new eventProxy();
  ep.on("suc", function (data) {
    if (data) {
      data = data.map(item => {
        item.followCount = item.follow.length;
        item.followedCount = item.followed.length;
        item.password = null;

        if (id !== item.id && role !== "admin") {
          item.follow = null;
          item.followed = null;
        }
        return item
      })

    } else {
      data = config.guestInfo;
    }
    res.json({
      code: 0,
      status: "success",
      result: data
    });
  });

  ep.on("error", function (err) {
    err.tip = "获取用户信息失败";
    return next(err);
  });

  // 默认只有 isDelete
  if (serachParams.id || role === 'admin') {
    // 查询用户的信息
    Users.find(
      serachParams).lean().exec(ep.done("suc"));
  } else if (id) {
    Users.find({
      id
    }).lean().exec(ep.done("suc"));
  } else {
    res.json({
      code: 1,
      status: "success",
      result: [config.guestInfo],
      msg: "尚未登录"
    });
  }
});

// 更新用户信息
router.post("/update", function (req, res, next) {
  var token = req.session.token;
  var userInfo = req.body.userInfo;
  var {
    id,
    role
  } = token;
  const ep = new eventProxy();
  ep.on('suc', function (data) {
    return res.json({
      code: 0,
      status: 'success',
      msg: '修改成功',
      result: data
    })
  })
  ep.on('err', function (err) {
    err.tip = '修改用户信息失败,请稍后再试';
    next(err);
  })
  if (id !== userInfo.id && role !== 'admin') {
    return res.json({
      code: 0,
      status: 'success',
      msg: '没有权限修改他人的信息'
    })
  }

  Users.createOrUpdate(userInfo, ep.done('suc'));
})

// 关注
router.post("/follow", function (req, res, next) {
  var fieldMap = {
    follow: 'follow',
    followCount: 'followCount',
    // 被专注目标的记录字段
    followedCount: 'followedCount'
  }
  common.follow(req, res, next, Users, fieldMap)
})

module.exports = router;