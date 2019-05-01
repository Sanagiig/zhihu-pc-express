const eventProxy = require("eventproxy");
const Counters = require("./counters");
module.exports = exports = function (schema, name) {
  schema.virtual("create_at").set(function (v) {
    this.createAt = v;
  });
  schema.virtual("update_at").set(function (v) {
    this.updateAt = v;
  });
  // schema.post('save',function(doc){
  //     this.create_at = Date.now()
  //     this.update_at = Date.now()
  // })
  schema.post("update", function (doc) {
    this.update_at = Date.now();
  });
  schema.statics.test = function () {};
  schema.statics.createOrUpdate = function (obj, cb) {
    const ep = new eventProxy();
    const Model = this.model(name);

    // 计算当前ID
    ep.on("count", function () {
      Counters.findOneAndUpdate({
        _id: name
      }, {
        $inc: {
          id: 1
        }
      }, function (
        err,
        data
      ) {
        if (err) {
          err.tip = "无法生成数据";
          err.message = '生成ID异常'
          throw err;
        }
        if (!data) {
          new Counters({
            _id: name,
            id: 0
          }).save(ep.done("create"));
        } else {
          ep.emit("create", data);
        }
      });
    });

    ep.on("create", function (num) {
      obj.id = typeof num === "number" ? num : num.id || 1;
      let modelInstance = new Model(obj);
      modelInstance.save(cb);
    });

    ep.on('update', function () {
      Model.findOneAndUpdate({
          id: obj.id
        }, obj, {
          new: true
        },

        cb
      );
    })
    ep.on("error", function (err) {
      err.tip = "创建失败";
      throw err;
    });
    if (obj.id) {
      ep.emit('update');
    } else {
      ep.emit("count");
    }
  };
};