const crypto = require('crypto');

const config = require('../config');

function passCipher(data) {
    var hash = crypto.createHash("md5");
    hash.update(data);
    var code = hash.digest('hex')
    return code;
}

module.exports = {
    passCipher
}