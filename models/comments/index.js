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
        default: 'normal'
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
    // 归属
    belongTo: {
        type: Number,
        require: [true, "belongId is empty"]
    },
    content: {
        type: String,
        require: [true, "content is empty"]
    },
    thumbUpUsers: {
        type: [Number],
        default: []
    },
    thumbDownUsers: {
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
    }
})

base(schema, "Comments");
schema.index({
    createAt: -1,
    updateAt: -1,
    id: 1
});
mongoose.model("Comments", schema);