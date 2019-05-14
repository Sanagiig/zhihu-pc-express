var express = require('express');
var router = express.Router();
var unzip = require('unzip')
var fs = require('fs');
var path = require('path');
var multer = require('multer');
var eventProxy = require('eventproxy');
var config = require('../../config');
var Users = require('../../models').Users;
var Works = require('../../models').Works;
var utils = require('../../utils');


var imgStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        var p = config.uploadPaths[file.fieldname];
        if (!p) throw new Error('图片名不匹配 !');
        cb(null, p);
    },
    filename: function (req, file, cb) {
        var token = req.session.token;
        var ext = path.extname(file.originalname);
        cb(null, `${token.loginName}_${file.fieldname}${ext}`);
    }
})

var workStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        var p = config.uploadPaths[file.fieldname];
        var token = req.session.token;
        if (p) {
            p = p.replace('{loginName}', token.loginName).replace('{workId}', req.body.id || 'none');
            fs.exists(p, function (isAccess) {
                if (isAccess) {
                    // 清空文件夹下所有文件
                    utils.clearDir(p);
                    cb(null, p);
                } else {
                    utils.makeDirs(p, function (err) {
                        if (err) throw err;
                        cb(null, p);
                    });
                }
            })
        } else {
            throw new Error('作品名不匹配 !');
        }
    },
    filename: function (req, file, cb) {
        var token = req.session.token;
        var ext = path.extname(file.originalname);
        cb(null, `${token.loginName}_${file.fieldname}_${req.body.id || 'none'}${ext}`);
    }
})

// 创建 multer 对象
var uploadImage = multer({
    storage: imgStorage
}).fields([{
    name: 'cover',
}, {
    name: 'avator',
}]);

var uploadWork = multer({
    storage: workStorage
}).fields([{
    name: 'work',
}]);

router.post('/image', function (req, res, next) {
    const {
        id
    } = req.session.token;
    const ep = new eventProxy();

    uploadImage(req, res, function (err, data) {
        if (err) {
            err.tip = "上传图片失败";
            return next(err);
        }
        let type = req.body.type;
        let file = req.files[type][0];

        let name = '';
        let dbField = '';
        // static 位置
        let index = file.path.indexOf('static');
        let url = config.host + (file.path.substring(index).replace(/\\+/g, '/'));
        switch (type) {
            case 'cover': {
                name = '封面';
                dbField = 'coverUrl';
                break;
            }
            case 'avator': {
                name = '头像';
                dbField = 'profileUrl';
                break;
            }
            default: {
                return ep.emit('图片类型错误');
            }
        }

        ep.on('suc', function () {
            res.json({
                code: '0',
                status: 'success',
                msg: `${name}上传成功`,
                result: url
            });
        })
        ep.on('err', function (msg) {
            var err = new Error(msg || '上传图片失败');
            err.tip = msg || "上传图片失败";
            next(err);
        })
        Users.update({
            id
        }, {
            [dbField]: url
        }, ep.done('suc'));
    })
});


router.post('/work', function (req, res, next) {
    const {
        id,
    } = req.session.token;
    const ep = new eventProxy();

    uploadWork(req, res, function (err, data) {
        if (err) {
            err.tip = "上传作品失败";
            return next(err);
        }
        let {
            id,
            type
        } = req.body;
        let file = req.files[type][0];
        let name = '';
        let dbField = '';
        // static 位置
        let index = file.path.indexOf('static');
        let url = config.host + (file.path.substring(index).replace(/\\+/g, '/').replace(/[^\/]*?$/, 'index.html'))
        
        switch (type) {
            case 'work': {
                name = '作品';
                dbField = 'displayUrl';
                break;
            }
            default: {
                return ep.emit('参数错误 [ type ]');
            }
        }
        console.log('url', url)
        ep.after('suc',2, function () {
            res.json({
                code: '0',
                status: 'success',
                msg: `${name}上传成功`,
                result: url
            });
        })
        ep.on('err', function (err) {
            var err = err || new Error(msg || `${name}上传失败`);
            err.tip = msg || `${name}上传失败`;
            next(err);
        })

        // 更新数据库
        Works.update({
            id
        }, {
            [dbField]: url
        }, ep.done('suc'));

        // 解压
        fs.createReadStream(file.path).on('end',ep.done('suc')).pipe(unzip.Extract({path:file.destination}))
    })
});
module.exports = exports = router;