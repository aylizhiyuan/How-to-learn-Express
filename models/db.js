/**
 * Created by hama on 2016/11/16.
 */
//连接数据库

//1.引入数据库的配置文件
var settings = require('../setting');
//2.引入连接数据库的mongodb模块
var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
//3.创建数据库连接对象
module.exports = new Db(settings.db,
    new Server(settings.host,settings.port),
    {safe:true}
)


