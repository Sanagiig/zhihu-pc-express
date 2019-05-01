const router = require('express').Router();
const Articles = require('../../models').Articles;
const Replies = require('../../models').Replies;
const Users = require('../../models').Users;
const eventProxy = require('eventproxy');
const common = require('../common');
const _ = require('lodash');

router.get('/count', function (req, res, next) {
    common.getCount(req, res, next, Replies);
})

router.get('/get', function (req, res, next) {

})
router.get('/getPagination/:pageSize/:curPage', function (req, res, next) {
    const fields = [
        'id',
        'type',
        'authorId',
        'belongTo',
        'replyTo',
        'content',
        'thumbUpUsers',
        'thumbDownUsers',
        'updateAt',
        'author'
    ]
    const ep = common.getPagination(req, res, next, Replies, fields, true);
    ep.on('pagination_ok', function (data) {
        if (!data) {
            return ep.emit('error', new Error('获取 Replies 分页数据失败'));
        }
        var userIdList = _.uniq(data.data.map(item => {
            return item.authorId
        }).concat(_.compact(data.data.map(item => {
            return item.replyTo
        }))))

        Users.find({
                id: {
                    $in: userIdList
                },
            }, ['id', 'profileUrl', 'nickname'])
            .lean()
            .exec(function (err, users) {
                if (err) {
                    return ep.emit('error', err)
                }
                // 组装数据
                for (var i = 0, len = data.data.length; i < len; i++) {
                    for (var j = 0, len2 = users.length; j < len2; j++) {
                        // 组装 author 字段
                        if (data.data[i].authorId === users[j].id) {
                            data.data[i].author = users[j]
                        }

                        // 组装 replyTo 字段
                        if (data.data[i].replyTo === users[j].id) {
                            data.data[i].replyTo = users[j]
                        }
                    }
                }

                ep.emit('assemble_ok', data);
            })
    })

    ep.on('assemble_ok', function (data) {
        res.json({
            code: 0,
            status: 'success',
            msg: 'ok',
            result: data
        })
    })
    return ep;
})

router.post('/add', function (req, res, next) {
    var params = req.body
    var {
        belongTo,
        replyTo,
        content
    } = params;

    var token = req.session.token
    const ep = new eventProxy();

    ep.on('ok', function (data) {
        res.json({
            code: 0,
            status: 'success',
            msg: '回复成功',
            result: data
        })
    })

    ep.on('error', function (err) {
        err.tip = err.tip || '评论失败, 请稍后再试';
        next(err);
    })

    if (!belongTo || !content) {
        return ep.emit('error', new Error('缺少必要参数 belongTo | content'));
    }

    // if (replyTo === token.id) {
    //     return res.json({
    //         code: 1,
    //         status: 'failure',
    //         msg: '不能对自己进行回复',
    //     })
    // }
    params.authorId = token.id;
    params.author = token._id;
    Replies.createOrUpdate(params, ep.done('ok'));
})


router.post('/delete', function (req, res, next) {

})

const thumb = common.thumb
// 点赞
router.post('/thumbUp', function (req, res, next) {
    thumb('thumbUp', req, res, next, Replies, 'thumbUpReplies', 'thumbDownReplies');
})

// 踩
router.post('/thumbDown', function (req, res, next) {
    thumb('thumbDown', req, res, next, Replies, 'thumbUpReplies', 'thumbDownReplies');
})

module.exports = exports = router;