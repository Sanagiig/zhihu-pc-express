const router = require('express').Router();
const Articles = require('../../models').Articles;
const eventProxy = require('eventproxy');
const config = require('../../app.config');
const testRouter = config.testApi ? require('./test') : null;

if(testRouter) router.use('/test',testRouter)

router.all('/upload', function (req, res, next) {
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
            id:data.id,
        }
        if (id) {
            ep.emit('update',result);
        } else {
            ep.emit('create',result);
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
    var ep = new eventProxy;
    var params = req.query;
    var curPage = params.curPage;
    var pageSize = params.pageSize || 15;
    var type = params.type;

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
    console.log('params',params)
    // 检测是否有type ， 有则转为搜索的格式
    if(type instanceof Array){
        params.type = {$in:type}
    }else if(typeof type === 'string'){
        params.type = {$in:[type]}
    }else{
        delete params.type;
    }

    if(curPage){
        delete params.curPage;
        delete params.pageSize;
        Articles.find(params,['_id','id','simpleText','title','authorId','type']).sort({updateAt:-1}).limit(pageSize).skip(curPage - 1).exec(ep.done('suc'));
    }else{
        Articles.find(params, ep.done('suc'));
    }
})

// 点赞
router.post('/thumbUp',function(req,res,next){
    var id = req.body.id;
    var userId = req.session.token.id
    var err = null;
    const ep = new eventProxy();
    ep.on('add',function(data){
        Articles.update({id},{$inc:{thumbUp:1},$push:{thumbUpUsers:userId}},ep.done('ok'))
    })
    ep.on('minus',function(data){
        Articles.update({id},{$inc:{thumbUp:-1},$pull:{thumbUpUsers:userId}},ep.done('ok'))
    })
    ep.on('ok',function(result){
        res.json({
            code:0,
            status:'success',
            result:result
        })
    })
    ep.on('error',function(err){
        next(err);
    })
    if(!id){
        err = new Error('参数不足，无法查找对应内容');
        err.tip = '参数不足，无法查找对应内容';
        return next(err);
    }

    Articles.findOne({id,thumbUpUsers:{$in:userId}},function(err,data){
        if(err){
            return next(err);
        }

        if(data){
            ep.emit('minus');
        }else{
            ep.emit('add');
        }
    })
})

// 踩
router.post('/thumbDown')

module.exports = router;