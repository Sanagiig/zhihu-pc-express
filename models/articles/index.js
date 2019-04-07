'use strict'
const mongoose = require('mongoose');
const base = require('../base.js');
const Schema = mongoose.Schema
var schema = new Schema({
    id: {
        type: Number,
        require: [true, 'id is empty'],
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        require: [true, 'author is empty'],
    },
    title: {
        type: String,
        require: [true, 'title is empty'],
    },
    simpleText: {
        type: String,
        require: [true, 'simpleText is empty'],
    },
    article: {
        type: String,
        require: [true, 'article is empty'],
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
})
base(schema,'Articles');
mongoose.model('Articles', schema);