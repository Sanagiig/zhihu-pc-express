const router = require("express").Router();
const eventProxy = require("eventproxy");
const passCipher = require("../../utils").passCipher;
const Users = require("../../models").Users;
const config = require("../../config");
const log = require("../../recorder").log;

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
      result: config.guestInfo,
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
  var {
    id
  } = req.session.token;
  var otherId = req.body.id;
  var isFollow = req.body.isFollow;
  const ep = new eventProxy();

  ep.after('ok', 2, function (data) {
    // 取出 follow
    var result

    // 判断数据是否同步
    if (!!data[0] !== !!data[1]) {
      log('error', `/aip/users/follow  follow_user [${id}] & followed_user [${otherId}]  数据不同步`);
    }

    // 将数据取出
    result = {
      follow: data[0].follow || data[1].follow,
      followedCount: (data[0].followed && data[0].followed.length) || (data[1].followed && data[1].followed.length)
    }
    // 更新 redis
    // req.session.token.follow = follow;
    // req.save();

    res.json({
      code: 0,
      status: 'success',
      msg: 'ok',
      result: result
    })
  })

  ep.on('error', function (err) {
    err.tip = err.tip || '关注失败,请稍后再试';
    next(err);
  })
  if (!otherId && typeof isFollow !== 'boolean') {
    return ep.emit('error', new Error('参数错误'));
  }

  if (!isFollow) {
    // 更新自身信息
    Users.findOneAndUpdate({
      id: id,
    }, {
      $push: {
        follow: otherId
      }
    }, {
      new: true,
      fields: {
        follow: 1
      }
    }).$where(`this.follow.indexOf(${otherId}) === -1`).exec(ep.done('ok'));
    // 更新被关注者信息
    Users.findOneAndUpdate({
      id: otherId,
    }, {
      $push: {
        followed: id
      }
    }, {
      new: true,
      fields: {
        followed: 1
      }
    }).$where(`this.followed.indexOf(${id}) === -1`).exec(ep.done('ok'));
  } else {
    // 更新自身信息
    Users.findOneAndUpdate({
      id,
    }, {
      $pull: {
        follow: otherId
      }
    }, {
      new: true,
      fields: {
        follow: 1
      }
    }).$where(`this.follow.indexOf(${otherId}) !== -1`).exec(ep.done('ok'));
    // 更新被关注者信息
    Users.findOneAndUpdate({
      id: otherId,
    }, {
      $pull: {
        followed: id
      }
    }, {
      new: true,
      fields: {
        followed: 1
      }
    }).$where(`this.followed.indexOf(${id}) !== -1`).exec(ep.done('ok'));
  }
})

module.exports = router;