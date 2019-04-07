const mongoose = require('mongoose');
const base = require('../base')
const schema = new mongoose.Schema({
    id: {
        type: Number,
        require: [true, 'id is empty'],
    },
    loginName: {
        type: String,
        require: [true, 'loginName is empty']
    },
    password: {
        type: String,
        require: [true, 'password is empty'],
    },
    role:{
        type:String,
        default:'normal'
    },
    profileUrl: String,
    nickname: String,
    realName: String,
    email: {
        type: String,
        marth: [/.*@.*\.(com|cn)/, 'email is illegal']
    },
    github: String,
    hobby: String,
    followCount: Number,
    followedCount: Number,
    core: Number,
    articleCount: Number,
    commentCount: Number,
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
})
base(schema,'Users');
mongoose.model('Users', schema);