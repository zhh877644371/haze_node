var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var haze_db = require('../mysql/dbconfig');
// var userSql = require('../mysql/usersql');

// 使用DBConfig.js的配置信息创建一个MySql链接池
var pool = mysql.createPool(haze_db);
// 响应一个JSON数据
var responseJSON = function (res, ret) {
  if (typeof ret === 'undefined') {
    res.json({
      code: '-200',
      msg: '操作失败'
    });
  } else {
    res.json(ret);
  }
};

router.get('/', function(req, res, next){
  pool.getConnection(function(err, connection) {
    // var email = req.query.email;
    // var password = req.query.password;
    // var selectSQL = "select * from user where email = '"+email+"' and password = '"+password+"'";
    var selectSQL = "select * from user";
    connection.query(selectSQL, function(err, rows, result) {
      if(err) {
        throw err;
      }
      responseJSON(res, rows);
      console.log('rows', typeof rows, rows);
      // res.cookie('email', 'hello@qq.com');
      // res.send(req.cookies.email);
    })

    connection.release();
  })
});

module.exports = router;