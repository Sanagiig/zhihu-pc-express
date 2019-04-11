function thumb(type, req, res, next) {
  var artId = req.body.id;
  var token = req.session.token;
  var userId = token ? token.id : null;
  var err = null;
  const ep = new eventProxy();

  const updateRedis = function(data) {
    req.session.token.thumbUpArticle = data.thumbUpArticle;
    req.session.save(function(err, data) {
      if (err) {
        err.tip = "redis 缓存用户数据失败";
        next(err);
      }
      ep.emit("ok");
    });
  };
  ep.on("add", function(data) {
    Articles.findOneAndUpdate(
      { id: artId },
      {
        $inc: { thumbUp: 1 },
        $push: { thumbUpUsers: userId },
        $pull: { thumbDownUsers: userId }
      },
      { fields: { thumbUp: 1 }, new: true },
      ep.done("ok")
    );
    Users.findOneAndUpdate(
      { id: userId },
      { $push: { thumbUpArticle: artId }, $pull: { thumbDownArticle: artId } },
      { fields: { thumbUpArticle: 1 }, new: true },
      function(err, data) {
        if (err) {
          err.tip = "用户点赞存储异常";
          return next(err);
        }
        // 更新缓存
        updateRedis(data);
      }
    );
  });
  ep.on("minus", function(data) {
    Articles.findOneAndUpdate(
      { id: artId },
      { $inc: { thumbUp: -1 }, $pull: { thumbUpUsers: userId } },
      { fields: { thumbUp: 1 }, new: true },
      ep.done("ok")
    );
    Users.findOneAndUpdate(
      { id: userId },
      { $pull: { thumbUpArticle: artId } },
      { fields: { thumbUpArticle: 1 }, new: true },
      function(err, data) {
        if (err) {
          err.tip = "用户取消点赞存储异常";
          return next(err);
        }
        // 更新缓存
        updateRedis(data);
      }
    );
  });
  ep.after("ok", 2, function(result) {
    // 只返回有效值
    result = result[0] ? result[0] : result[1];
    res.json({
      code: 0,
      status: "success",
      result: result
    });
  });
  ep.on("error", function(err) {
    next(err);
  });
  if (!userId) {
    err = new Error("请先登录, 再对文章点赞");
    err.tip = "请先登录, 再对文章点赞";
    return next(err);
  } else if (!artId) {
    err = new Error("参数不足，无法查找对应内容");
    err.tip = "参数不足，无法查找对应内容";
    return next(err);
  }

  Articles.findOne(
    { id: artId, thumbUpUsers: { $in: userId } },
    ["id"],
    function(err, data) {
      if (err) {
        return next(err);
      }
      if (data) {
        ep.emit("minus");
      } else {
        ep.emit("add");
      }
    }
  );
}
thumbUp;
module.exports = exports = {};
