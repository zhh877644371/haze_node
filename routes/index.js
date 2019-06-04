var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var haze_db = require('../mysql/dbconfig');
var userSql = require('../mysql/usersql');

// 使用dbconfig.js的配置信息创建一个MySql链接池
var pool = mysql.createPool(haze_db);

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

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// 登录接口
router.post('/login', function(req, res, next){
  pool.getConnection(function(err, connection){
    var param = req.body;
    var selectSQL = `select * from user where email = '${param.email}' and password = ${param.pwd}`;
    connection.query(selectSQL, function(err, rows){
      if(err) {
        throw err;
      }
      var data = {};
      if(rows.length == 0) {
        data.code = -1;
        data.msg = "用户邮箱或密码错误！";
        responseJSON(res, data);
      } else {
        data.code = 200;
        data.userEmail = rows[0].email;
        data.msg = "登录成功！";
        responseJSON(res, data);
      }
    })
    connection.release();
  })
});

// 注册接口
router.post('/reg', function(req, res, next){
  pool.getConnection(function(err, connection){
    var param = req.body;
    var userEmail = param.email;
    var userPwd = param.pwd;
    connection.query(userSql.queryAllUser, function(err, rows){
      if(err) {
        console.error('err', err);
        throw err;
      }
      var isExist = false;
      for(var i of rows) {
        if(typeof i === 'object' && i.email == userEmail) {
          isExist = !isExist;
        }
      }
      var data;
      if(isExist) {
        data = {
          code: 1,
          msg: '用户已存在，请直接登录！'
        }
        responseJSON(res, data);
      } else {
        connection.query(userSql.insertUser, [userEmail, userPwd], function(err, rows){
          if(rows.affectedRows > 0) {
            data = {
              code: 200,
              msg: '注册成功！'
            }
          } else {
            data = {
              code: -1,
              msg: `注册失败！${err}`
            }
          }
          responseJSON(res, data);
        })
      }
      connection.release();
    });
  });
});

// 修改密码接口
router.post('/changePwd', function(req, res, next){
  pool.getConnection(function(err, connection){
    var param = req.body;
    var selectSQL = `UPDATE user SET password = ${param.newPwd} WHERE (email = '${param.email}')`;
    connection.query(selectSQL, function(err, rows){
      console.log('rows', rows);
      if(err) {
        //console.error('err', err);
        throw err;
      }
      var data = {};
      if(rows.affectedRows > 0) {
        data.code = 200;
        data.msg = "密码修改成功！";
      } else {
        data.code = -1;
        data.msg = "密码修改失败！";
      }
      responseJSON(res, data);
    })
    connection.release();
  })
});

// 获取雷达比数据
router.get('/getLidarData', function(req, res, next){
  let param = req.query || req.params;
  pool.getConnection(function(err, connection){
    if(err) {
      console.warn('err', err);
      throw err;
    }
    let selectSQL = `select * from image_data where country = '${param.country || ''}'`;
    if(param.location) {
      selectSQL += ` and location_tip = '${param.location || ''}'`;
    }
    console.log('selectSQL', selectSQL);
    connection.query(selectSQL, function(err, rows){
      if(err) {
        throw err;
      }
      let data = {};
      data.code = 200;
      data.msg = "操作成功！";
      let tmpArr1 = rows.filter(item => {
        return item.wavelength == '355nm';
      });
      let tmpArr2 = rows.filter(item => {
        return item.wavelength == '532nm';
      });
      if(tmpArr1.length == rows.length) {
        data.wavelength = '355nm';
      } else if(tmpArr2.length == rows.length) {
        data.wavelength = '532nm';
      } else if((tmpArr1.length + tmpArr2.length) == rows.length) {
        data.wavelength = '355nm和532nm';
      } else {
        data.wavelength = "多种";
      }
      data.result = rows.map(item => {
        delete item.extin_value;
        delete item.figure_number;
        delete item.image_data_id;
        delete item.province;
        return item;
      });
      responseJSON(res, data);
    })
    connection.release();
  })
});

// 获取论文信息
router.get('/getPaperInfo', function(req, res, next){
  let param = req.query || req.params;
  pool.getConnection(function(err, connection){
    if(err) {
      console.warn('err', err);
      throw err;
    }
    let selectSql = `select * from paper_info where id = ${param.paper_id || 0}`;
    console.log('sql', selectSql)
    connection.query(selectSql, function(err, arr) {
      if(err) {
        throw err;
      }
      let data = {};
      console.log('arr', arr);
      if(arr.length == 1) {
        data.code = 200;
        data.paper_info = {
          name: arr[0].name,
          id: arr[0].id,
          file_name: arr[0].file_name
        };
        data.msg = "操作成功！";
      } else {
        data.code = -1;
        data.msg = "未能查询到相应论文信息！";
      }
      responseJSON(res, data);
    });
    connection.release();
  })
});

// 获取查询数据
router.get('/getSearchData', function(req, res, next){
  let param = req.query || req.params;
  let country = param.country || '';
  let wavelength = param.wavelength || '';
  pool.getConnection(function(err, connection){
    if(err) {
      console.warn('err', err);
      throw err;
    }
    let selectSQL = 'select * from image_data';
    if(country && wavelength) {
      selectSQL += ` where country = '${country}' and wavelength = '${wavelength}'`;
    } else if(country) {
      selectSQL += ` where country = '${country}'`;
    } else if(wavelength) {
      selectSQL += ` where wavelength = '${wavelength}'`;
    }
    console.log('selectSQL', selectSQL);
    connection.query(selectSQL, function(err, rows){
      if(err) {
        throw err;
      }
      let data = {};
      if(rows.length == 0) {
        data.code = -1;
        data.msg = "查询失败！暂无数据~";
      } else {
        data.code = 200;
        data.msg = "查询成功！";
        data.result = rows.map(item => {
          delete item.extin_value;
          delete item.figure_number;
          delete item.image_data_id;
          delete item.province;
          return item;
        });
      }
      responseJSON(res, data);
    })
    connection.release();
  })
});

// 获取论文数据
router.get('/getPaperData', function(req, res, next){
  // let param = req.query || req.params;
  pool.getConnection(function(err, connection){
    if(err) {
      console.warn('err', err);
      throw err;
    }
    let selectSQL = 'select * from paper_info';
    connection.query(selectSQL, function(err, rows){
      if(err) {
        throw err;
      }
      let data = {};
      if(rows.length == 0) {
        data.code = -1;
        data.msg = "查询失败！";
      } else {
        data.code = 200;
        data.msg = "查询成功！";
        data.result = rows.map(item => {
          delete item.file_name;
          delete item.figure_numbers;
          delete item.image_data_ids;
          delete item.save_path;
          return item;
        });
      }
      responseJSON(res, data);
    })
    connection.release();
  })
});

// 获取论文数据
router.get('/getEuropeData', function(req, res, next){
  let param = req.query || req.params;
  let station = param.station;
  pool.getConnection(function(err, connection){
    if(err) {
      console.warn('err', err);
      throw err;
    }
    // let selectSQL = 'select * from europe_data';
    // if(station) {
    //   selectSQL += ` where station = '${station}'`
    // }
    let selectSQL = `select * from europe_data where station = '${station}' and Backscatter is not null and Backscatter <> '--' and Extinction is not null and Extinction <> '' and Extinction <> '--' and EXtinction <> '0.0'`;
    connection.query(selectSQL, function(err, rows){
      if(err) {
        throw err;
      }
      let data = {};
      if(rows.length == 0) {
        data.code = -1;
        data.msg = "操作失败！";
      } else {
        data.code = 200;
        data.msg = "查询成功！";
        data.result = rows.map(item => {
          delete item.Filenames;
          return item;
        });
      }
      responseJSON(res, data);
    })
    connection.release();
  })
});

module.exports = router;
