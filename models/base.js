const eventProxy = require('eventproxy');

module.exports = exports = function (schema, name) {
    schema.virtual('create_at').set(function (v) {
        this.createAt = v;
    })
    schema.virtual('update_at').set(function (v) {
        this.updateAt = v;
    })
    // schema.post('save',function(doc){
    //     this.create_at = Date.now()
    //     this.update_at = Date.now()
    // })
    schema.post('update', function (doc) {
        this.update_at = Date.now()
    })
    schema.statics.test = function () {}
    schema.statics.createOrUpdate = function (obj, cb) {
        const ep = new eventProxy();
        const Model = this.model(name);

        ep.on('count', function () {
            Model.countDocuments({}, ep.done('create'));
        })
        ep.on('create', function (num) {
            obj.id = num ? num + 1 : 1;
            let modelInstance = new Model(obj);
            modelInstance.save(cb);
        })
        ep.on('error', function (err) {
            err.tip = '创建失败';
            throw err;
        })
        if (obj.id) {
            Model.update({
                id: obj.id
            }, obj, cb);
        } else {
            ep.emit('count');
        }
    }
}