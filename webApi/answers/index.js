const router = require("express").Router();
const eventProxy = require("eventproxy");
const Answers = require("../../models").Answers;
const common = require('../common');
const config = require("../../config");
const log = require("../../recorder").log;
const _ = require('lodash');

router.get('/get', function (req, res, next) {
    var params = req.query;
    const ep = new eventProxy();
    const fields = [
        'id',
        'type',
        'authorId',
        'belongTo',
        'content',
        'followedCount',
        'updateAt',
        'class',
        'author'
    ]

    ep.on('ok', function (data) {
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
    Answers.find(params, fields).exec(ep.done('ok'));
})

router.get('/getPagination/:pageSize/:curPage', function (req, res, next) {
    const fields = [
        'id',
        'type',
        'authorId',
        'belongTo',
        'content',
        'thumbUpUsers',
        'thumbUpCount',
        'thumbDownUsers',
        'thumbDownCount',
        'updateAt',
        'author'
    ]

    const userFields = ['id', 'profileUrl', 'nickname']

    const ep = common.getPagination(req, res, next, Answers, fields, true);
    ep.on('pagination_ok', function (data) {
        if (!data) {
            return ep.emit('error', new Error('获取 Answers 分页数据失败'));
        }
        var userIdList = _.uniq(data.data.map(item => {
            return item.authorId
        }).concat(_.compact(data.data.map(item => {
            return item.replyTo
        }))))

        common.userInfoAssemble(ep, data, userIdList, userFields);
    })

    ep.on('userinfo_assemble_ok', function (data) {
        res.json({
            code: 0,
            status: 'success',
            msg: 'ok',
            result: data
        })
    })
})

router.post('/add', function (req, res, next) {
    var params = req.body;
    var token = req.session.token
    const ep = new eventProxy();

    ep.on('ok', function (data) {
        res.json({
            code: 0,
            status: 'success',
            msg: '回答提交成功',
        })
    })

    ep.on('error', function (err) {
        err.tip = err.tip || '回答失败, 请稍后再试';
        next(err);
    })

    if (!params || !params.content || !params.belongTo) {
        return ep.emit('error', new Error('缺少必要参数 title '));
    }

    params.authorId = token.id;
    params.author = token._id;
    Answers.createOrUpdate(params, ep.done('ok'));
})

const thumb = common.thumb
// 点赞
router.post('/thumbUp', function (req, res, next) {
    thumb('thumbUp', req, res, next, Answers, 'thumbUpAnswers', 'thumbDownAnswers');
})

// 踩
router.post('/thumbDown', function (req, res, next) {
    thumb('thumbDown', req, res, next, Answers, 'thumbUpAnswers', 'thumbDownAnswers');
})

module.exports = router;