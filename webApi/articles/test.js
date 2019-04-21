const express = require("express");
const router = express.Router();
const config = require("../../config");
const Articles = require("../../models").Articles;

function charFactor(isUplower) {
  var start = isUplower ? 65 : 97;
  return String.fromCharCode(parseInt(Math.random() * 26) + start);
}

function strFactor(min, max) {
  min = min || 5;
  max = max || 15;
  var num = min + parseInt(Math.random() * max);
  var result = "";
  for (var i = 0; i < num; i++) {
    if (i === 0) {
      result += charFactor(true);
    } else {
      result += charFactor();
    }
  }
  return result;
}

function articleFactor(wordNum) {
  wordNum = wordNum || 1000;
  var article = "";
  for (var i = 0; i < wordNum; i++) {
    article += strFactor() + "  ";
  }
  return {
    title: strFactor(),
    type: ["system", "hot", "recommend", "follow"],
    article,
    simpleText: article.slice(0, 200),
    id: Date.now() + parseInt(1000 * Math.random())
  };
}

router.all("/", function (req, res, next) {
  Articles.find({
      id: req.body.id
    })
    .populate({
      path: "author"
    })
    .exec((err, data) => {
      res.json({
        res: data,
        id: req.body.id
      });
    });
});

router.post("/multiUpload", function (req, res, next) {
  var num = req.body.num || 10;
  var articles = [];
  for (var i = 0; i < num; i++) {
    articles.push(articleFactor());
  }
  Articles.insertMany(articles, function (err, data) {
    if (err) {
      err.tip = "生成文章失败";
      return next(err);
    }
    res.json({
      code: 0,
      status: "success",
      result: data
    });
  });
});

module.exports = exports = router;