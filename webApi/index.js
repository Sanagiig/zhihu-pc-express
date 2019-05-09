const router = require('express').Router();
const articleRouter = require('./articles')
const usersRouter = require('./users');
const commentsRouter = require('./comments');
const repliesRouter = require('./replies');
const uploadRouter = require('./upload');
const questionRouter = require('./questions');
const answerRouter = require('./answers');
const workRouter = require('./works');
router.use('/articles', articleRouter)
router.use('/users', usersRouter);
router.use('/comments', commentsRouter);
router.use('/replies', repliesRouter);
router.use('/upload', uploadRouter);
router.use('/questions', questionRouter);
router.use('/answers', answerRouter);
router.use('/works', workRouter);
module.exports = router;