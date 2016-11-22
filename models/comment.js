/**
 * Created by hama on 2016/11/22.
 */
var mongo = require('./db');
//设计留言处理对象
function Comment(name,minute,title,comment){
    //发布文章的用户
    this.name = name;
    //文章的发布时间
    this.minute = minute;
    //文章的标题
    this.title = title;
    //以上三个是查询的条件

    //才是真正的留言内容.
    this.comment = comment;
}
//保存留言的方法
Comment.prototype.save = function(callback){
    var name = this.name;
    var minute = this.minute;
    var title = this.title;
    var comment = this.comment;
    //搜集一下信息
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            //保存留言到对应的文章的comments字段里面去.
            collection.update({
                "name":name,
                "time.minute":minute,
                "title":title
            },{
                $push:{"comments":comment}
            },function(err){
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}
module.exports = Comment;

