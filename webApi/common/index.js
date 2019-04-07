const sucResTmp = {
    code: 1,
    status: 'success',
    msg: 'OK',
    result: []
}

const failResTmp = {
    code: 1,
    status: 'failure',
    msg: '数据错误',
}

const errResTmp = {
    code: 1,
    status: 'error',
    msg: '服务器异常',
    err: `errType: errMsg`
}

module.exports = {
    sucResTmp,
    failResTmp,
    errResTmp
}