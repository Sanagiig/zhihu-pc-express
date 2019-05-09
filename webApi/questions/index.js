const router = require("express").Router();
const eventProxy = require("eventproxy");
const Users = require("../../models").Users;
const Questions = require("../../models").Questions;
const config = require("../../config");
const log = require("../../recorder").log;

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
    Questions.find(params, fields).exec(ep.done('ok'));
})

router.get('/getPagination/:pageSize/:curPage', function (req, res, next) {
    const fields = [
        'id',
        'type',
        'authorId',
        'belongTo',
        'content',
        'folloedCount',
        'thumbDownUsers',
        'updateAt',
        'author'
    ]
    common.getPagination(req, res, next, Questions, fields);
})

router.post('/add', function (req, res, next) {
    var params = req.body;
    var token = req.session.token
    const ep = new eventProxy();

    ep.on('ok', function (data) {
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
    Questions.createOrUpdate(params, ep.done('ok'));
})

router.post('/follow', function (req, res, next) {
    var params = req.body;
    var {
        isFollow
    } = params;
    var token = req.session.token
    const ep = new eventProxy();

    ep.after('ok', 2, function (data) {
        var result = {};
        if (!!data[0] !== !!data[1]) {
            log('error', `/api/question/follow  user [${token.id}] & question [${params.id}]  数据不同步`);
        }

        // 将数据取出 , 并判断操作是否生效
        try {
            result.followedCount = typeof data[0].followedCount === 'number' ? data[0].followedCount : data[1].followedCount
        } catch {
            log('error', `/api/question/follow  user [${token.id}] & question [${params.id}]  本次操作无效, 可能当前页面数据未同步`);
        } finally {
            result.isFollow = isFollow
        }

        res.json({
            code: 0,
            status: 'success',
            msg: isFollow ? '关注成功' : '取关成功',
            result
        })
    })

    ep.on('error', function (err) {
        err.tip = err.tip || '关注失败,请稍后再试';
        next(err);
    })

    if (!params.id || typeof isFollow === 'undefined') {
        return ep.emit('error', new Error('缺少必要参数 id | isFollow '));
    }

    // 关注
    if (isFollow) {
        Users.findOneAndUpdate({
            id: token.id,
            followQuestion: {
                $ne: params.id
            }
        }, {
            $push: {
                followQuestion: params.id
            },

            $inc: {
                followQuestionCount: 1
            }
        }, {
            fields: {
                _id: 1
            },
            new: true
        }).lean().exec(ep.done('ok'))
        console.log('xxx', {
            id: params.id,
            followed: {
                $ne: token.id
            }
        })
        Questions.findOneAndUpdate({
            id: params.id,
            followed: {
                $ne: token.id
            },
        }, {
            $push: {
                followed: token.id
            },
            $inc: {
                followedCount: 1
            }
        }, {
            fields: {
                followedCount: 1
            },
            new: true
        }).lean().exec(ep.done('ok'))
    } else {
        // 取关
        Users.findOneAndUpdate({
            id: token.id,
            followQuestion: params.id
        }, {
            $pull: {
                followQuestion: params.id
            },
            $inc: {
                followQuestionCount: -1
            }
        }, {
            fields: {
                _id: 1
            },
            new: true
        }).lean().exec(ep.done('ok'))

        Questions.findOneAndUpdate({
            id: params.id,
            followed: token.id
        }, {
            $pull: {
                followed: token.id
            },
            $inc: {
                followedCount: -1
            }
        }, {
            fields: {
                followedCount: 1
            },
            new: true
        }).lean().exec(ep.done('ok'))
    }

})

module.exports = router;