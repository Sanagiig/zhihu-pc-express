const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const base = require("../base");
const schema = Schema({
    id: {
        type: Number,
        require: [true, "id is empty"]
    },
    type: {
        type: String,
        default: 'article'
    },
    // 分类
    class: {
        default: [],
        type: [String],
    },
    tags: {
        type: [String],
        default: []
    },
    author: {
        type: Schema.Types.ObjectId,
        require: [true, "author is empty"],
        ref: "Users",
    },
    authorId: {
        type: Number,
        require: [true, "authorId is empty"]
    },
    title: {
        type: String,
        require: [true, "title is empty"]
    },
    content: {
        type: String,
        require: [true, "content is empty"]
    },
    // 关注、被关注的信息
    followed: {
        type: Array,
        default: []
    },
    followedCount: {
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
})

base(schema, "Questions");
schema.index({
    createAt: -1,
    updateAt: -1,
    id: -1
});
mongoose.model("Questions", schema);