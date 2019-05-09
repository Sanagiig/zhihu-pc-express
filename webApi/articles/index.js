const router = require('express').Router();
const Articles = require('../../models').Articles;
const Users = require('../../models').Users;
const eventProxy = require('eventproxy');
const config = require('../../config');
const common = require('../common');
const testRouter = config.testApi ?
    require('./test') :
    null;

if (testRouter)
    router.use('/test', testRouter)


router.post('/upload', function (req, res, next) {
    let {
        id,
        title,
        article
    } = req.body;
    let = ep = new eventProxy();
    let token = req.session.token;
    req.body.authorId = token._id;
    if (!title || !article) {
        let err = new Error('标题和文章不能为空');
        err.tip = '标题和文章不能为空';
        return next(err);
    }

    req.body.type = ["hot", "recommend", "follow"]
    Articles.createOrUpdate(req.body, function (err, data) {
        if (err) {
            err.tip = '上传文章失败'
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
})

router.get('/get', function (req, res, next) {
    const fields = [
        'id',
        'title',
        'simpleText',
        'article',
        'createAt',
        'updateAt'
    ]
    common.get(req, res, next, Articles, fields);
})

router.get('/getPagination/:pageSize/:curPage', function (req, res, next) {
    const fields = [
        '_id',
        'id',
        'simpleText',
        'title',
        'authorId',
        'type',
        'thumbUpUsers',
        'thumbDownUsers'
    ];
    const ep = common.getPagination(req, res, next, Articles, fields, true);
    ep.on('pagination_ok', function (data) {
        if (!data) {
            return ep.emit('error', new Error('获取 Articles 分页数据失败'));
        }

        res.json({
            code: 0,
            status: 'success',
            msg: 'ok',
            result: data
        })
    })
})


const thumb = common.thumb
// 点赞
router.post('/thumbUp', function (req, res, next) {
    thumb('thumbUp', req, res, next, Articles, 'thumbUpArticles', 'thumbDownArticles');
})

// 踩
router.post('/thumbDown', function (req, res, next) {
    thumb('thumbDown', req, res, next, Articles, 'thumbUpArticles', 'thumbDownArticles');
})

module.exports = router;