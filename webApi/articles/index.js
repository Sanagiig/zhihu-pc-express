const router = require('express').Router();
const Articles = require('../../models').Articles;
const eventProxy = require('eventproxy');

router.all('/test', function (req, res, next) {
    Articles.find({
        id: req.body.id
    }).populate({
        path: 'author'
    }).exec((err, data) => {
        res.json({
            res: data,
            id: req.body.id
        })
    })
})
router.all('/upload', function (req, res, next) {
    let {
        id,
        title,
        article
    } = req.body;
    let = ep = new eventProxy();
    let token = req.session.token;
    req.body.author = token._id;
    if (!title || !article) {
        let err = new Error('标题和文章不能为空');
        err.tip = '标题和文章不能为空';
        return next(err);
    }

    Articles.createOrUpdate(req.body, function (err, data) {
        if (err) {
            err.tip = '编辑文章失败'
            return next(err);
        }
        if (id) {
            ep.emit('update');
        } else {
            ep.emit('create');
        }
    })

    ep.on('create', function () {
        res.json({
            code: 0,
            status: 'success',
            msg: `成功发表 < ${title} >`
        })
    })
    ep.on('update', function () {
        res.json({
            code: 0,
            status: 'success',
            msg: `成功修改 < ${title} >`
        })
    })
})

router.get('/get', function (req, res, next) {
    var ep = new eventProxy;
    var params = req.query;
    Articles.findOne(params, ep.done('suc'));
    ep.on('suc', function (data) {
        res.json({
            code: 0,
            status: 'success',
            msg: 'ok',
            result: data
        })
    })
    ep.on('error', function (err) {
        err.tip = '获取文章失败,可能该文章已被删除';
        next(err)
    })
})

module.exports = router;