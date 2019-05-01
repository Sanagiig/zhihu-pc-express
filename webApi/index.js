const router = require('express').Router();
const articleRouter = require('./articles')
const usersRouter = require('./users');
const commentsRouter = require('./comments');
const repliesRouter = require('./replies');
const uploadRouter = require('./upload');
router.use('/articles', articleRouter)
router.use('/users', usersRouter);
router.use('/comments', commentsRouter);
router.use('/replies', repliesRouter);
router.use('/upload', uploadRouter);
module.exports = router;