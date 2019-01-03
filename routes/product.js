var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next){
    var data = {
        code: 0,
        date: {
            name: 'aaa',
            pwd: '123'
        },
        isSuccess: true,
        msg: '请求成功'
    };
    res.json(data);
});

module.exports = router;