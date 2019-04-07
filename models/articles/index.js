"use strict";
const mongoose = require("mongoose");
const base = require("../base.js");
const Schema = mongoose.Schema;
var schema = new Schema({
  id: {
    type: Number,
    require: [true, "id is empty"]
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    require: [true, "author is empty"]
  },
  title: {
    type: String,
    require: [true, "title is empty"]
  },
  simpleText: {
    type: String,
    require: [true, "simpleText is empty"]
  },
  article: {
    type: String,
    require: [true, "article is empty"]
  },
  type: {
    type: [String],
    default: ["normal"]
  },
  thumbUpUsers: [Number],
  thumbUp: {
    type: Number,
    default: 0
  },
  thumbDownUsers: [Number],
  thumbDown: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
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
  }
});
base(schema, "Articles");
schema.index({ createAt: -1, updateAt: -1, id: -1 });
mongoose.model("Articles", schema);
