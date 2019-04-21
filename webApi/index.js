const router = require('express').Router();
const articleRouter = require('./articles')
const usersRouter = require('./users');
const uploadRouter = require('./upload');
router.use('/articles', articleRouter)
router.use('/users', usersRouter);
router.use('/upload', uploadRouter);
module.exports = router;