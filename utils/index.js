const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

function passCipher(data) {
    var hash = crypto.createHash("md5");
    hash.update(data);
    var code = hash.digest('hex')
    return code;
}

// 递归创建文件夹
function makeDirs(dir, cb) {
    fs.exists(dir, function (isAccess) {
        if (isAccess) {
            cb();
        } else {
            makeDirs(path.dirname(dir), function () {
                fs.mkdir(dir, cb);
            })
        }
    });
}

// 清空某个文件夹下所有文件和文件夹
function clearDir(path,delCurDir){
    let files = [];
    if(fs.existsSync(path)){
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            let curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()){
                clearDir(curPath,true); //递归删除文件夹
            } else {
                fs.unlinkSync(curPath); //删除文件
            }
        });
        if(delCurDir){
            fs.rmdirSync(path);
        }
    }
}

module.exports = {
    passCipher,
    makeDirs,
    clearDir
}