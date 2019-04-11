const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const base = require("../base");
const schema = Schema({
  id: {
    type: Number,
    require: [true, "id is empty"]
  },
  loginName: {
    type: String,
    require: [true, "loginName is empty"]
  },
  password: {
    type: String,
    require: [true, "password is empty"]
  },
  role: {
    type: String,
    default: "normal"
  },
  profileUrl: String,
  nickname: String,
  realName: String,
  email: {
    type: String,
    marth: [/.*@.*\.(com|cn)/, "email is illegal"]
  },
  github: String,
  hobby: String,
  followCount: Number,
  followedCount: Number,
  core: Number,
  articles: {
    type: [Number]
  },
  articleCount: Number,

  commentCount: Number,
  thumbUpArticle: {
    type: [Number],
    default: []
  },
  thumbDownArticle: {
    type: [Number],
    default: []
  },
  thumbUpComment: {
    type: [Number],
    default: []
  },
  thumbDownComment: {
    type: [Number],
    default: []
  },

  createAt: {
    type: Date,
    default: Date.now
  },
  updateAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  }
});
base(schema, "Users");
mongoose.model("Users", schema);
