/**
 * Created by hama on 2016/11/18.
 */
var mongo = require('./db');
//引入markdown插件
var markdown = require('markdown').markdown;
function Post(name,title,tags,post){
    //发布人
    this.name = name;
    //标题
    this.title = title;
    //内容
    //XSS跨站脚本攻击的预防.
    //this.post = post.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    //接收一下标签信息
    this.tags = tags;
    this.post = post;
}
module.exports = Post;
//保存文章
Post.prototype.save  = function(callback){
    var date = new Date();
    //保存当前时间的各种格式
    var time = {
        date:date,
        year:date.getFullYear(),
        month:date.getFullYear() + '-' + (date.getMonth() + 1),
        day:date.getFullYear() + '-' +
        (date.getMonth() + 1) + '-' + date.getDate(),
        minute:date.getFullYear() + '-' +
        (date.getMonth() + 1) + '-' + date.getDate() + ' ' +
            date.getHours() + ':' +
        (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes() + ':' + date.getSeconds())
    };
    //我们要保存的数据
    var post = {
        name:this.name,
        time:time,
        title:this.title,
        //接收一下标签信息
        tags:this.tags,
        post:this.post,
        //新增的留言字段
        comments:[]
    }
    //接下来就是常规的打开数据库->读取posts集合->内容插入->关闭数据库
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.insert(post,{safe:true},function(err){
                mongo.close();
                if(err){
                    return callback(err);
                }
                //如果没有错的情况下,保存文章，不需要返回数据.
                callback(null);
            })
        })
    })
}
//获取所有的文章
Post.getTen = function(name,page,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            var query = {};
            if(name){
                query.name = name;
            }
            //查询
            collection.count(query,function(err,total){
                //total是查询的文章总数量
                collection.find(query,{
                    //根据当前的页数算出每页开始的位置pageStart
                    skip: (page - 1) * 10,
                    //pageSize 理解为步长
                    limit:10
                }).sort({
                    time:-1
                }).toArray(function(err,docs){
                    mongo.close();
                    if(err){
                        return callback(err);
                    }
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null,docs,total);
                })
            })
        })
    })
}
//可以根据用户名、发布时间、文章标题来查询某一篇具体的文章
Post.getOne = function(name,minute,title,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.findOne({
                "name":name,
                "time.minute":minute,
                "title":title
            },function(err,doc){
                mongo.close();
                if(err){
                    callback(err);
                }
                //markdown解析一下
                doc.post = markdown.toHTML(doc.post);
                //把留言的内容用markdown解析一下
                doc.comments.forEach(function(comment){
                    comment.content = markdown.toHTML(comment.content);
                })
                callback(null,doc);
            })
        })
    })
}
//为文章添加编辑功能，返回markdown格式的原始内容
Post.edit = function(name,minute,title,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.findOne({
                "name":name,
                "time.minute":minute,
                "title":title
            },function(err,doc){
                mongo.close();
                if(err){
                    return callback(err);
                }
                return callback(null,doc);//返回查询文章的原始格式.
            })
        })
    })
}
//修改操作
Post.update = function(name,minute,title,post,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.update({
                "name":name,
                "time.minute":minute,
                "title":title
            },{$set:{post:post}},function(err){
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}
//删除操作
Post.remove = function(name,minute,title,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.remove({
                "name":name,
                "time.minute":minute,
                "title":title
            },{
                w:1
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
//返回包含用户名，发布时间，标题的文章。
Post.getArchive = function(callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            //只获取到发布人，发布时间，发布的标题
            collection.find({},{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function(err,docs){
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
}
//找到所有的标签信息
Post.getTags = function(callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.distinct('tags',function(err,docs){
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);//返回所有的不重复的标签
            })
        })
    })
}
//获取标签所对应的文章
Post.getTag = function(tag,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.find({
                "tags":tag
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function(err,docs){
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
}