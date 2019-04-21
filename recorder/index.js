module.exports = {
    log(type, v) {
        console.log(`${type}: <${(new Date).toLocaleString()}> ${v}`);
    }
}