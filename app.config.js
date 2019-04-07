const config = {
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
  needLoginUrl: ["/api/articles/upload", "/api/articles/delete"],
  // 不允许用户看已删除数据的列表
  limitSearchUrl: ["/api/articles/get"]
};

module.exports = config;
