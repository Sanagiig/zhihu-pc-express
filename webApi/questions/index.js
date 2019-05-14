const router = require("express").Router();
const eventProxy = require("eventproxy");
const Users = require("../../models").Users;
const Questions = require("../../models").Questions;
const config = require("../../config");
const log = require("../../recorder").log;
const common = require("../common");
router.get('/getClassList', function (req, res, next) {
    res.json({
        code: 0,
        status: 'success',
        msg: 'ok',
        result: config.questionClassList
    })
})

router.get('/get', function (req, res, next) {
    var params = req.query;
    const ep = new eventProxy();
    const fields = [
        'id',
        'type',
        'authorId',
        'belongTo',
        'title',
        'content',
        'followedCount',
        'simpleText',
        'updateAt',
        'class',
        'author'
    ]

    ep.on('get_ok', function (data) {
        res.json({
            code: 0,
            status: 'success',
            msg: 'ok',
            result: data
        })
    })

    ep.on('error', function (err) {
        next(err);
    })
    Questions.find(params, fields).exec(ep.done('get_ok'));
})

router.get('/getPagination/:pageSize/:curPage', function (req, res, next) {
    const fields = [
        'id',
        'type',
        'title',
        'authorId',
        'belongTo',
        'content',
        'folloedCount',
        'thumbDownUsers',
        'simpleText',
        'updateAt',
        'author'
    ]
    common.getPagination(req, res, next, Questions, fields);
})

router.post('/add', function (req, res, next) {
    var params = req.body;
    var token = req.session.token
    const ep = new eventProxy();

    ep.on('add_ok', function (data) {
        res.json({
            code: 0,
            status: 'success',
            msg: '问题发布成功',
        })
    })

    ep.on('error', function (err) {
        err.tip = err.tip || '提问失败, 请稍后再试';
        next(err);
    })

    if (!params.title || !params) {
        return ep.emit('error', new Error('缺少必要参数 title '));
    }

    params.authorId = token.id;
    params.author = token._id;
    Questions.createOrUpdate(params, ep.done('add_ok'));
})

router.post('/follow', function (req, res, next) {
    var fieldMap = {
        follow: 'followQuestions',
        followCount: 'followQuestionCount',
        // 被专注目标的记录字段
        followedCount: 'followedCount'
      }
      common.follow(req, res, next, Questions, fieldMap)
})

module.exports = router;