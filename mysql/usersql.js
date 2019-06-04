var UserSQL = {
  insertUser: 'INSERT INTO User(email, password) VALUES(?,?)', // 插入数据
  dropTable: 'DROP TABLE User', // 删除表中所有的数据
  queryAllUser: 'SELECT * FROM User', // 查找表中所有数据
  getUserByEmail: 'SELECT * FROM User WHERE email =?', // 查找符合条件的数据
};
module.exports = UserSQL;