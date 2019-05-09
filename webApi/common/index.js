var eventProxy = require('eventproxy');
const Users = require("../../models").Users;
const log = require("../../recorder").log;

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @param {Object} notSend 不发送回复的标识
 */
// 获取数量
function getCount(req, res, next, targetModel, notSend) {
    let params = req.query;
    const ep = new eventProxy();
    ep.on('count_ok', function (count) {
        if (typeof count !== 'number') {
            return ep.emit('error', new Error(`count 不合法 ! 查询条件为 [ ${JSON.stringify(params)} ] `));
        }

        // 检测是否不send 数据
        if (!notSend) {
            res.json({
                code: 0,
                status: 'success',
                msg: 'ok',
                result: count
            })
        }
    })

    ep.on('error', function (err) {
        err.tip = err.tip || '查询数据量时出现异常';
        next(err);
    })
    targetModel.find(params).count(ep.done('count_ok'));
    return ep;
}



// 获取分页信息
/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @param {*} targetModel 
 * @param {*} fields 
 * @param {*} notSend 
 */
function getPagination(req, res, next, targetModel, fields, notSend) {
    let params = Object.assign(req.query, req.params);
    var curPage = parseInt(params.curPage || 1);
    var pageSize = parseInt(params.pageSize || 15);
    var totalCount;

    delete params.curPage;
    delete params.pageSize;

    if (!curPage || !pageSize) {
        let err = new Error('缺少分页信息')
        err.tip = '缺少分页信息';
        return ep.emit('error', err);
    }

    const ep = getCount(req, res, next, targetModel, true);

    ep.on('count_ok', function (count) {
        totalCount = count;
        targetModel.find(params, fields).sort({
                updateAt: -1
            }).lean().limit(pageSize)
            .skip((curPage - 1) * pageSize)
            .exec(function (err, data) {
                if (err) {
                    err.tip = '查询分页信息错误'
                    return next(err)
                }
                // 处理点赞信息
                if (data && data.length && data[0].thumbUpUsers) {
                    data = data.map(item => {
                        item.thumbUp = item.thumbUpUsers.length;
                        item.thumbDown = item.thumbDownUsers.length;
                        item.thumbUpUsers = null;
                        item.thumbDownUsers = null;
                        return item
                    })
                }

                ep.emit('pagination_ok', {
                    data: data,
                    pageInfo: {
                        curPage,
                        pageSize,
                        totalCount
                    }
                })
            });
    })

    ep.on('pagination_ok', function (data) {
        if (notSend) return;

        res.json({
            code: 0,
            status: 'success',
            msg: 'ok',
            result: data
        })
    })

    ep.on('error', function (err) {
        err.tip = err.tip || '获取分页信息失败'
        next(err)
    })

    return ep;
}


/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @param {*} targetModel 
 * @param {*} fields 
 * @param {*} notSend 
 */
function get(req, res, next, targetModel, fields, notSend) {
    var params = req.query;
    const ep = new eventProxy();
    ep.on('ok', function (data) {
        if (notSend) return;

        res.json({
            code: 0,
            status: 'success',
            msg: 'ok',
            result: data
        })
    })

    ep.on('error', function (err) {
        if (err) {
            err.tip = '查询数据失败';
        } else {
            err = new Error('查看数据失败');
        }
        return next(err);
    })

    targetModel.find(params, fields).lean().exec(ep.done('ok'));
    return ep;
}


function update(req, res, next, targetModel, newData, fields, notSend) {
    var token = req.session.token;
    var params = req.body;
    var {
        id,
        role
    } = token;

    const ep = new eventProxy();
    ep.on('update_ok', function (data) {
        if (notSend) return;
        return res.json({
            code: 0,
            status: 'success',
            msg: '修改成功',
            result: data
        })
    })
    ep.on('err', function (err) {
        err.tip = '修改失败,请稍后再试';
        next(err);
    })
    if (id !== params.authorId && role !== 'admin') {
        return res.json({
            code: 0,
            status: 'success',
            msg: '没有权限修改他该数据'
        })
    }

    targetModel.createOrUpdate(params, newData, fields).exec(ep.done('update_ok'));
    return ep;
}


// 点赞或踩
/**
 * 
 * @param {String} type 评论类型
 * @param {Object} req 
 * @param {Object} res 
 * @param {Object} next 
 * @param {Object} targetModel 目标model
 * @param {String} thumbUpField 
 * @param {String} thumbDownField 
 */
function thumb(type, req, res, next, targetModel, thumbUpField, thumbDownField) {
    var artId = req.body.id;
    var token = req.session.token;
    var userId = token ?
        token.id :
        null;
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

    if (type === 'thumbUp') {
        artThumb = {
            id: artId,
            thumbUpUsers: {
                $in: userId
            }
        };
        //  添加赞
        artAddThumbUpdate = {
            $push: {
                thumbUpUsers: userId
            },
            $pull: {
                thumbDownUsers: userId
            }
        }
        userAddThumbUpdate = {
            $push: {
                [thumbUpField]: artId
            },
            $pull: {
                [thumbDownField]: artId
            },

        }
        // 取消赞
        artRemoveThumbUpdate = {
            $pull: {
                thumbUpUsers: userId
            }
        }
        userRemoveThumbUpdate = {
            $pull: {
                [thumbUpField]: artId
            }
        }
        // 错误提示
        errTipByAdd = '用户点赞操作存储异常'
        errTipByRemove = '用户取消点赞操作存储异常'
    } else if (type === 'thumbDown') {
        artThumb = {
            id: artId,
            thumbDownUsers: {
                $in: userId
            }
        };
        //  添加踩
        artAddThumbUpdate = {
            $push: {
                thumbDownUsers: userId
            },
            $pull: {
                thumbUpUsers: userId
            }
        }
        userAddThumbUpdate = {
            $push: {
                [thumbDownField]: artId
            },
            $pull: {
                [thumbUpField]: artId
            },
        }
        // 取消踩
        artRemoveThumbUpdate = {
            $pull: {
                thumbDownUsers: userId
            }
        }
        userRemoveThumbUpdate = {
            $pull: {
                [thumbDownField]: artId
            }
        }
        // 错误提示
        errTipByAdd = '用户反对操作存储异常'
        errTipByRemove = '用户取消反对操作存储异常'
    }
    const updateRedis = function (data) {
        req.session.token[thumbUpField] = data[thumbUpField];
        req.session.token[thumbDownField] = data[thumbDownField];
        req.session
            .save(function (err, data) {
                if (err) {
                    err.tip = 'redis 缓存用户评论数据失败';
                    next(err);
                }
                ep.emit('ok');
            });
    }
    ep.on('add', function (data) {
        targetModel.findOneAndUpdate({
            id: artId
        }, artAddThumbUpdate, {
            fields: {
                thumbUpUsers: 1,
                thumbDownUsers: 1
            },
            new: true
        }, ep.done('ok'));
        Users.findOneAndUpdate({
            id: userId
        }, userAddThumbUpdate, {
            fields: {
                [thumbUpField]: 1,
                [thumbDownField]: 1
            },
            new: true
        }, function (err, data) {
            if (err) {
                err.tip = errTipByAdd;
                return next(err);
            }
            ep.emit('ok');
            // 更新缓存
            // updateRedis(data);
        });
    })
    ep.on('minus', function (data) {
        targetModel.findOneAndUpdate({
            id: artId
        }, artRemoveThumbUpdate, {
            fields: {
                thumbUpUsers: 1,
                thumbDownUsers: 1
            },
            new: true
        }, ep.done('ok'))
        Users.findOneAndUpdate({
            id: userId
        }, userRemoveThumbUpdate, {
            fields: {
                [thumbUpField]: 1,
                [thumbDownField]: 1
            },
            new: true
        }, function (err, data) {
            if (err) {
                err.tip = errTipByRemove;
                return next(err);
            }
            ep.emit('ok');
            // 更新缓存
            // updateRedis(data);
        });
    })
    ep.after('ok', 2, function (result) {
        // 只返回有效值
        result = result[0] ?
            result[0] :
            result[1];
        res.json({
            code: 0,
            status: 'success',
            result: {
                thumbUp: result.thumbUpUsers.length,
                thumbDown: result.thumbDownUsers.length,
                isThumbUp: type === 'thumbUp' ? result.thumbUpUsers.indexOf(userId) !== -1 : false,
                isThumbDown: type === 'thumbDown' ? result.thumbDownUsers.indexOf(userId) !== -1 : false,
            }
        })
    })
    ep.on('error', function (err) {
        next(err);
    })
    if (!userId) {
        err = new Error('请先登录, 再评论');
        err.tip = '请先登录, 再评论';
        return next(err);
    } else if (!artId) {
        err = new Error('参数不足，无法查找对应内容');
        err.tip = '参数不足，无法查找对应内容';
        return next(err);
    }
    targetModel.findOne(artThumb, ['id'], function (err, data) {
        if (err) {
            return next(err);
        }
        if (data) {
            ep.emit('minus');
        } else {
            ep.emit('add');
        }
    })
}

function userInfoAssemble(ep, data, userIdList, fields) {
    Users.find({
            id: {
                $in: userIdList
            },
        }, fields)
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

            ep.emit('userinfo_assemble_ok', data);
        })
}

module.exports = {
    getCount,
    getPagination,
    get,
    update,
    thumb,
    userInfoAssemble
}