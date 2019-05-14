const router = require('express').Router();
const Articles = require('../../models').Articles;
const Comments = require('../../models').Comments;
const Users = require('../../models').Users;
const eventProxy = require('eventproxy');
const common = require('../common');


router.get('/count', function (req, res, next) {
    common.getCount(req, res, next, Comments);
})

router.get('/get', function (req, res, next) {

})
router.get('/getPagination/:pageSize/:curPage', function (req, res, next) {
    const fields = [
        'id',
        'type',
        'authorId',
        'belongTo',
        'content',
        'thumbUpUsers',
        'thumbDownUsers',
        'updateAt',
        'author'
    ]
    const ep = common.getPagination(req, res, next, Comments, fields, true);
    ep.on('pagination_ok', function (data) {
        if (!data) {
            return ep.emit('error', new Error('获取 Comments 分页数据失败'));
        }
        var userIdList = data.data.map(item => {
            return item.authorId
        })

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
                        if (data.data[i].authorId === users[j].id) {
                            data.data[i].author = users[j]
                            break;
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
        content
    } = params;

    var token = req.session.token
    const ep = new eventProxy();

    ep.on('add_ok', function (data) {
        res.json({
            code: 0,
            status: 'success',
            msg: '评论成功',
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

    params.authorId = token.id;
    params.author = token._id;
    Comments.createOrUpdate(params, ep.done('add_ok'));
})


router.post('/delete', function (req, res, next) {

})

const thumb = common.thumb
// 点赞
router.post('/thumbUp', function (req, res, next) {
    thumb('thumbUp', req, res, next, Comments, 'thumbUpComments', 'thumbDownComments');
})

// 踩
router.post('/thumbDown', function (req, res, next) {
    thumb('thumbDown', req, res, next, Comments, 'thumbUpComments', 'thumbDownComments');
})
module.exports = router;