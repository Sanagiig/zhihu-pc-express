const config = require('../../app.config')
const loginList = config.needLoginUrl;

function loginCheck(req, res, next) {
    var err = null;
    var path = req.path;
    var token = req.session.token;

    if (!token) {
        for (var i = 0, len = loginList.length; i < len; i++) {
            var pattern = loginList[i];
            if ((typeof pattern === 'string' && path.indexOf(pattern) === 0 ||
                    pattern instanceof RegExp && pattern.test(path))) {
                err = new Error('请先登陆再访问相关内容');
                err.tip = '请先登陆再访问相关内容';
                err.code = 403;
                break;
            }
        }
    }

    next(err);
}

module.exports = {
    loginCheck
}