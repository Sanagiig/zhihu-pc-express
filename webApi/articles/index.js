const router = require('express').Router();
const Articles = require('../../models').Articles;
const Users = require('../../models').Users;
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
        let token = req.session.token;
        let upArtList = token ? token.thumbUpArticle || [] : [];
        let downArtList = token ? token.thumbDownArticle || [] : [];
        // 给点过赞的文章做标识
        if(token){
            if(data instanceof Array){
                data = data.map(item =>{
                    if(upArtList.indexOf(item.id) !== -1) item.isThumbUp = true;
                    if(downArtList.indexOf(item.id) !== -1) item.isThumbDown = true;
                    item.thumbUp = item.thumbUpUsers.length || 0;
                    item.thumbDown = item.thumbDownUsers.length || 0;
                    delete item.thumbUpUsers;
                    delete item.thumbDownUsers
                    
                    return item
                })
            }else{
                data.isThumbUp = upArtList.indexOf(data.id) !== -1
                data.isThumbDown = downArtList.indexOf(data.id) !== -1;
            }
        }
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
        Articles.find(params,['_id','id','simpleText','title','authorId','type','thumbUpUsers','thumbDownUsers'],{lean:true}).sort({updateAt:-1}).limit(pageSize).skip(curPage - 1).exec(ep.done('suc'));
    }else{
        Articles.find(params,{isDelete:0},{lean:true}, ep.done('suc'));
    }
})

// 点赞或踩
function thumb(type,req,res,next){
    var artId = req.body.id;
    var token = req.session.token;
    var userId = token ? token.id :null;
    var err = null;
    // 查看文章状态
    var artThumb;
    // 文章添加评价的更新
    var artAddThumbUpdate;
    // 文章删除评价的更新
    var artRemoveThumbUpdate;
    // 用户添加评价的更新
    var userAddThumbUpdate;
    // 用户删除评价的更新
    var userRemoveThumbUpdate;
    // 错误提示
    var errTipByAdd;
    var errTipByRemove;
    const ep = new eventProxy();

    if(type === 'thumbUp'){
        artThumb = {id:artId,thumbUpUsers:{$in:userId}};
        //  添加赞
        artAddThumbUpdate = {$inc:{thumbUp:1},$push:{thumbUpUsers:userId},$pull:{thumbDownUsers:userId}}
        userAddThumbUpdate = {$push:{thumbUpArticle:artId},$pull:{thumbDownArticle:artId}}
        // 取消赞
        artRemoveThumbUpdate = {$inc:{thumbUp:-1},$pull:{thumbUpUsers:userId}}
        userRemoveThumbUpdate = {fields:{thumbUp:1},new:true}
        // 错误提示
        errTipByAdd = '用户点赞操作存储异常'
        errTipByRemove = '用户取消点赞操作存储异常'
    }else if(type === 'thumbDown'){
        artThumb = {id:artId,thumbDownUsers:{$in:userId}};
        //  添加踩
        artAddThumbUpdate = {$inc:{thumbDown:1},$push:{thumbDownUsers:userId},$pull:{thumbUpUsers:userId}}
        userAddThumbUpdate = {$push:{thumbDownArticle:artId},$pull:{thumbUpArticle:artId}}
        // 取消踩
        artRemoveThumbUpdate = {$inc:{thumbDown:-1},$pull:{thumbDownUsers:userId}}
        userRemoveThumbUpdate = {fields:{thumbDown:1},new:true}
        // 错误提示
        errTipByAdd = '用户反对操作存储异常'
        errTipByRemove = '用户取消反对操作存储异常'
    }
    const updateRedis = function(data){
        req.session.token.thumbUpArticle = data.thumbUpArticle;
        req.session.token.thumbDownArticle = data.thumbDownArticle;
        req.session.save(function(err,data){
            if(err){
                err.tip = 'redis 缓存用户数据失败';
                next(err);
            }
            ep.emit('ok');
        });
    }
    ep.on('add',function(data){
        Articles.findOneAndUpdate({id:artId},artAddThumbUpdate,{fields:{thumbUpUsers:1,thumbDownUsers:1},new:true},ep.done('ok'));
        Users.findOneAndUpdate({id:userId},userAddThumbUpdate,{fields:{thumbDownArticle:1,thumbUpArticle:1},new:true},function(err,data){
            if(err){
                err.tip = errTipByAdd;
                return next(err);
            }
            // 更新缓存
            updateRedis(data);
        });
    })
    ep.on('minus',function(data){
        Articles.findOneAndUpdate({id:artId},artRemoveThumbUpdate,{fields:{thumbUpUsers:1,thumbDownUsers:1},new:true},ep.done('ok'))
        Users.findOneAndUpdate({id:userId},userRemoveThumbUpdate,{fields:{thumbDownArticle:1,thumbUpArticle:1},new:true},function(err,data){
            if(err){
                err.tip = errTipByRemove;
                return next(err);
            }
            // 更新缓存
            updateRedis(data);
        });
    })
    ep.after('ok',2,function(result){
        // 只返回有效值
        result = result[0] ? result[0] : result[1];
        console.log('result',result);
        res.json({
            code:0,
            status:'success',
            result:{
                thumbUp:result.thumbUpUsers.length,
                thumbDown:result.thumbDownUsers.length,
            }
        })
    })
    ep.on('error',function(err){
        next(err);
    })
    if(!userId){
        err = new Error('请先登录, 再对文章点赞');
        err.tip = '请先登录, 再对文章点赞';
        return next(err);
    }else if(!artId){
        err = new Error('参数不足，无法查找对应内容');
        err.tip = '参数不足，无法查找对应内容';
        return next(err);
    }
    Articles.findOne(artThumb,['id'],function(err,data){
        if(err){
            return next(err);
        }
        if(data){
            ep.emit('minus');
        }else{
            ep.emit('add');
        }
    })
}
// 点赞
router.post('/thumbUp',function(req,res,next){
    thumb('thumbUp',req,res,next);
})

// 踩
router.post('/thumbDown',function(req,res,next){
    thumb('thumbDown',req,res,next);
})

module.exports = router;