const fs = require('fs');
const path = require('path');
const user = require('./config.user');
const question = require('./config.question');
const log = require('../recorder').log;
const makeDirs = require('../utils').makeDirs;


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
  needLoginUrl: [
    "/api/articles/upload",
    "/api/articles/delete",
    "/api/comments/add",
    "/api/upload/image",
    "/api/follow/follow",
    /^\/api\/.*upload/,
    // 点赞 | 反对
    /^\/api\/.*(thumbUp|thumbDown)/
  ],
  // 不允许用户看已删除数据的列表
  limitSearchUrl: [/\/api\/(articles|comments|users)\/get/],
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
    file: path.join(upPath, '/file'),
    // 作品
    work: path.join(upPath, '/work/{loginName}/{workId}'),
  },

  // 问题相关
  questionClassList: question.classList
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