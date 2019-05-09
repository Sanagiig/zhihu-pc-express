const router = require("express").Router();
const eventProxy = require("eventproxy");
const Works = require("../../models").Works;
const config = require("../../config");
const log = require("../../recorder").log;

module.exports = router;