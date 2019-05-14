const router = require("express").Router();
const eventProxy = require("eventproxy");
const Works = require("../../models").Works;
const config = require("../../config");
const log = require("../../recorder").log;

const common = require('../common');
router.get('/get', function (req, res, next) {
    const fields = [
        'id',
        'type',
        'authorId',
        'title',
        'displayUrl',
        'followedCount',
        'thumbUpCount',
        'thumbDownCount',
        'simpleText',
        'updateAt',
        'author'
    ]
    common.get(req,res,next,Works,fields,true);
})

router.get('/getDetail', function (req, res, next) {
    const fields = [
        'id',
        'type',
        'authorId',
        'title',
        'content',
        'displayUrl',
        'followedCount',
        'thumbUpCount',
        'thumbDownCount',
        'updateAt',
        'author'
    ]
    const ep = common.get(req,res,next,Works,fields,true);
    ep.on('get_ok', function (data) {
        var result = {};
        if(data){
            result = data[0]
        }
        res.json({
            code: 0,
            status: 'success',
            msg: 'ok',
            result: result
        })
    })
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
    common.getPagination(req, res, next, Works, fields);
})

router.post('/upload', function (req, res, next) {
    let params = req.body
    let {
        id,
        title,
        content
    } = params;
    let = ep = new eventProxy();
    let token = req.session.token;
    var fields = [
        'id',
    ]
    params.authorId = token._id;
    params.type = params.type instanceof Array ? params.type : [params.type]

    ep.on('create', function (result) {
        res.json({
            code: 0,
            status: 'success',
            msg: `成功发表 < ${title} >`,
            result
        })
    })
    ep.on('update', function (result) {
        res.json({
            code: 0,
            status: 'success',
            msg: `成功修改 < ${title} >`,
            result
        })
    })

    if (!title || !content) {
        let err = new Error('标题和内容不能为空');
        err.tip = '标题和内容不能为空';
        return next(err);
    }

    Works.createOrUpdate(params,fields, function (err, data) {
        if (err) {
            err.tip = '作品发布失败'
            return next(err);
        }
        let result = {
            id: data.id
        }
        if (id) {
            ep.emit('update', result);
        } else {
            ep.emit('create', result);
        }
    })
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

        Works.findOneAndUpdate({
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

        Works.findOneAndUpdate({
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