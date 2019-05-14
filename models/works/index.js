const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const base = require("../base");
const schema = Schema({
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
    content: {
        type: String,
        require: [true, "content is empty"]
    },
    type: {
        type: [String],
        default: ["normal"]
    },
    displayUrl: {
        type: String,
        default: null
    },
    thumbUpUsers: [Number],
    thumbUpCount: {
        type: Number,
        default: 0
    },
    thumbDownUsers: [Number],
    thumbDownCount: {
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
})

base(schema, "Works");
schema.index({
    createAt: -1,
    updateAt: -1,
    id: 1
});
mongoose.model("Works", schema);