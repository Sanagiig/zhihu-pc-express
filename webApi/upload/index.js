var express = require('express');
var router = express.Router();
var path = require('path');
var multer = require('multer');
var eventProxy = require('eventproxy');
var config = require('../../config');
var Users = require('../../models').Users;


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

// 创建 multer 对象
var uploadImage = multer({
    storage: imgStorage
}).fields([{
    name: 'cover',
}, {
    name: 'avator',
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
            case 'cover':
                {
                    name = '封面';
                    dbField = 'coverUrl';
                    break;
                }
            case 'avator':
                {
                    name = '头像';
                    dbField = 'profileUrl';
                    break;
                }
            default:
                {
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

module.exports = exports = router;