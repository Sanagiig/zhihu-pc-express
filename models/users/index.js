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
  profileUrl: {
    type: String,
    default: '/static/images/guest_profile.jpg'
  },
  coverUrl: {
    type: String,
    default: "/static/images/default_cover.jpg"
  },
  nickname: {
    type: String,
    default: function () {
      return Date.now().toString(32)
    }
  },
  realName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    marth: [/.*@.*\.(com|cn)/, "email is illegal"]
  },
  // 性别
  sex: Boolean,
  // 简介
  briefIntroduction: {
    type: String,
    default: '这家伙很懒啥也没留下~~'
  },
  // 详细介绍
  introduction: {
    type: String,
    default: ''
  },
  address: String,
  github: String,
  hobby: String,
  core: Number,
  // 关注、被关注的信息
  follow: {
    type: Array,
    default: []
  },
  followed: {
    type: Array,
    default: []
  },
  articles: {
    type: [Number]
  },
  articleCount: {
    type: Number,
    default: 0
  },
  thumbUpArticles: {
    type: [Number],
    default: []
  },
  thumbDownArticles: {
    type: [Number],
    default: []
  },
  comments: {
    type: [Number]
  },
  commentCount: {
    type: Number,
    default: 0
  },
  thumbUpComments: {
    type: [Number],
    default: []
  },
  thumbDownComments: {
    type: [Number],
    default: []
  },
  replies: {
    type: [Number]
  },
  repliesCount: {
    type: Number,
    default: 0
  },
  thumbUpReplies: {
    type: [Number],
    default: []
  },
  thumbDownReplies: {
    type: [Number],
    default: []
  },
  isDelete: {
    type: Boolean,
    default: false
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