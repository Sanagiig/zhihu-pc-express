const fs = require('fs');
const path = require('path');
const user = require('./config.user');
const log = require('../recorder').log;

const makeDirs = function (dir, cb) {
  fs.exists(dir, function (isAccess) {
    if (isAccess) {
      cb();
    } else {
      makeDirs(path.dirname(dir), function () {
        fs.mkdir(dir, cb);
      })
    }
  });
}

const upPath = path.join(__dirname, '/../static/upload/');
const config = {
  host: '/',
  devPort: 8888,
  dbUrl: "mongodb://47.100.183.40:27017/zhihu",
  secretCode: "Sanagi.",
  redisHost: "47.100.183.40",
  redisPort: "6379",
  RedisPass: "Laiwenjun@1993",
  // 会话保持时间（秒）
  sessionTTL: 60 * 60 * 24,
  // 是否应用testApi
  testApi: true,
  //需要登陆才能访问的列表
  needLoginUrl: ["/api/articles/upload", "/api/articles/delete", "/api/upload/image", "/api/follow//follow"],
  // 不允许用户看已删除数据的列表
  limitSearchUrl: [/.*(articles|comments)\/get/],
  // 来客信息
  guestInfo: user.guestInfo,
  // 上传位置
  uploadPaths: {
    // 目录
    uploadPath: upPath,
    // 封面
    cover: path.join(upPath, '/cover'),
    // 头像
    avator: path.join(upPath, '/avator'),
    // 文件
    file: path.join(upPath, '/file')
  }

};

// 创建相关文件夹
for (var name in config.uploadPaths) {
  let p = config.uploadPaths[name];
  makeDirs(p, function (err) {
    if (err) {
      log('err', `创建${p}失败 [err]`)
    }
  });
}

module.exports = config;