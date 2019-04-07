const router = require('express').Router();
const articleRouter = require('./articles')
const usersRouter = require('./users');
router.use('/articles',articleRouter)
router.use('/users',usersRouter);
module.exports = router;