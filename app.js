const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const connectRedis = require("connect-redis")(session);
const midware = require("./middleware");
const apiRouter = require("./webApi");
const log = require("./recorder").log;
const config = require("./config");
const app = express();

var redisOpt = {
  host: config.redisHost,
  port: config.redisPort,
  ttl: config.sessionTTL,
  pass: config.RedisPass,
  no_ready_check: true,
};

app.use("/static", express.static(path.join(__dirname, "static")));
app.use(
  bodyParser.json({
    limit: "1mb"
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "1mb"
  })
);

// 使用 session 中间件
app.use(
  session({

    secret: config.secretCode, // 对session id 相关的cookie 进行签名
    resave: true,
    saveUninitialized: false, // 是否保存未初始化的会话
    logErrors: true,
    store: new connectRedis(redisOpt),
    cookie: {
      maxAge: config.sessionTTl * 1000 // 设置 session 的有效时间，单位毫秒
    }
  })
);
app.use(function (req, res, next) {
  next();
})
midware.register(app);

app.all("/api/test", function (req, res, next) {
  console.log(req.body);
  res.json({
    test: "yes"
  });
});

app.use("/api", apiRouter);

app.use(function (err, req, res, next) {
  log("error", `${err.tip || "服务器异常, 请骚后再试"} [${err.message}]`);
  res.json({
    code: err.code || 1,
    status: "error",
    msg: err.tip || "服务器异常,请骚后再试",
    err: err.message
  });
});
app.listen(config.devPort);