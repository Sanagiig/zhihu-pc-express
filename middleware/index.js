const commonMid = require('./common');
const usersMid = require('./users');
const articlesMid = require('./articles');

module.exports = exports = function(req,res,next){
    Object.keys(commonMid).forEach(name =>{
        commonMid[name](req,res,next);
    })

    Object.keys(usersMid).forEach(name =>{
        usersMid[name](req,res,next);
    })

    Object.keys(articlesMid).forEach(name =>{
        articlesMid[name](req,res,next);
    })
}
