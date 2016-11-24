//登录和注册需要的User类
var User = require('../models/user');
//发表需要的Post类
var Post = require('../models/post');
//引入留言需要的Comment类
var Comment = require('../models/comment');
//需要引入一个加密的模块
var crypto = require('crypto');
//引入multer插件
var multer = require('multer');
//插件的配置信息
var storage = multer.diskStorage({
    //这个是上传图片的地址.
    destination:function(req,file,cb){
        cb(null,'public/images')
    },
    //上传到服务器上图片的名字.
    filename:function(req,file,cb){
        cb(null,file.originalname)
    }
})
var upload = multer({storage:storage,size:10225});

//一个权限的问题？
//1.用户未登录的情况下，是无法访问/post ,/logout的
//2.用户在登录的情况下，是无法访问/login,/reg 的
//那么，如果才能完成这个权限的问题呢？

function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录!');
        res.redirect('/login');
    }
    next();
}
//如果登录了，是无法访问登录和注册页面的
function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录!');
        res.redirect('back');//返回之前的页面
    }
    next();
}
module.exports = function(app){
    //首页
    app.get('/',function(req,res){
        var page = parseInt(req.query.p) || 1;
        Post.getTen(null,page,function(err,posts,total){
            if(err){
                posts = [];
            }
            res.render('index',{
                title:'首页',
                user:req.session.user,
                page:page,
                posts:posts,
                isFirstPage: (page - 1) == 0,
                isLastPage: (page - 1) * 10 + posts.length == total,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })

    })
    //注册页面
    app.get('/reg', checkNotLogin);
    app.get('/reg',function(req,res){
        res.render('reg',{
            title:'注册',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    //注册行为
    app.post('/reg', checkNotLogin);
    app.post('/reg',function(req,res){
        //数据接收req.body
        //console.log(req.body);
        //用户名
        var name = req.body.name;
        //密码
        var password = req.body.password;
        //确认密码
        var password_re = req.body['password-repeat'];
        //邮箱
        var email = req.body.email;
        //补充一下，如果未填写的情况下，提示用户
        if(name == '' || password == '' || password_re == '' || email == ''){
            req.flash('error','请正确填写信息');
            return res.redirect('/reg');
        }
        //1.首先检查一下两次密码是否一样
        if(password_re != password){
            //先保存一下当前的错误信息
            req.flash('error','用户两次输入的密码不一样');
            return res.redirect('/reg');
        }
        //2.对密码进行加密处理
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        //console.log(password);

        //3.可以开始实例化User对象了
        var newUser = new User({
            name:name,
            password:password,
            email:email
        });
        //4.检查用户名是否存在
        User.get(newUser.name,function(err,user){
            //如果发生了错误,跳转回首页
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            //如果存在重复的用户名
            if(user){
                req.flash('error','用户名已经存在');
                return res.redirect('/reg');
            }
            //正确情况下
            newUser.save(function(err,user){
                if(err){
                    req.flash('error',err);
                }
                //用户信息存入session
                req.session.user = newUser;
                //console.log(req.session.user);
                req.flash('success','注册成功');
                res.redirect('/');
            })
        })
    })
    //登录
    app.get('/login', checkNotLogin);
    app.get('/login',function(req,res){
        res.render('login',{
            title:'登录',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    //登录行为
    app.post('/login', checkNotLogin);
    app.post('/login',function(req,res){
        //1.检查下用户名有没有
        //2.检查下密码对不对
        //3.存储到session中用户的登录信息
        //4.跳转到首页
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        User.get(req.body.name,function(err,user){
            if(!user){
                //说明用户名不存在
                req.flash('error','用户名不存在');
                return res.redirect('/login');
            }
            //检查两次密码是否一样
            if(user.password != password){
                req.flash('error','密码错误');
                return res.redirect('/login');
            }
            req.session.user = user;
            //console.log(req.session.user);
            req.flash('success','登录成功');
            res.redirect('/');
        })

    })
    //发表
    app.get('/post', checkLogin);
    app.get('/post',function(req,res){
        res.render('post',{
            title:'发表',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    //发表行为
    app.post('/post', checkLogin);
    app.post('/post',function(req,res){
        //当前SESSION里面的用户信息
        var currentUser = req.session.user;
        //判断一下内容不能为空
        if(req.body.title == '' || req.body.post == ''){
            req.flash('error','内容不能为空');
            return res.redirect('/post');
        }
        var post = new Post(currentUser.name,req.body.title,req.body.post);
        post.save(function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            req.flash('success','发布成功');
            res.redirect('/');
        })
    })
    //上传
    app.get('/upload',checkLogin);
    app.get('/upload',function(req,res){
        res.render('upload',{
            title:'文件上传',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    //上传行为
    app.post('/upload',checkLogin);
    app.post('/upload',upload.array('field1',5),function(req,res){
        req.flash('success','文件保存成功');
        res.redirect('/upload');
    })
    //退出
    app.get('/logout',function(req,res){
        //1.清除session
        //2.给用户提示
        //3.跳转到首页
        req.session.user = null;
        req.flash('success','成功退出');
        res.redirect('/');
    })
    //点击用户名，可以看到用户发布的所有文章
    app.get('/u/:name', function (req, res) {
        var page = parseInt(req.query.p) || 1;
        //检查用户是否存在
        User.get(req.params.name, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在!');
                return res.redirect('/');
            }
            //查询并返回该用户第 page 页的 10 篇文章
            Post.getTen(user.name, page, function (err, posts, total) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    posts: posts,
                    page: page,
                    isFirstPage: (page - 1) == 0,
                    isLastPage: ((page - 1) * 10 + posts.length) == total,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });
    //文章详情页面
    app.get('/u/:name/:minute/:title',function(req,res){
        Post.getOne(req.params.name,req.params.minute,req.params.title,function(err,post){
            if(err){
                req.flash('error','找不到当前文章');
                return res.redirect('/');
            }
            res.render('article',{
                title:req.params.title,
                user:req.session.user,
                post:post,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
    })
    //文章的留言发布
    app.post('/comment/:name/:minute/:title',function(req,res){
        var date = new Date();
        var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var comment = {
            name:req.body.name,
            time:time,
            content:req.body.content
        }
        var newCommnet = new Comment(req.params.name,req.params.minute,req.params.title,comment);
        newCommnet.save(function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','发布成功');
            res.redirect('back');

        })
    })
    //文章编辑
    app.get('/edit/:name/:minute/:title',checkLogin);
    app.get('/edit/:name/:minute/:title',function(req,res){
        //获取到当前的用户
        var currentUser = req.session.user;
        Post.edit(currentUser.name,req.params.minute,req.params.title,function(err,post){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            res.render('edit',{
                title:'编辑文章',
                user:req.session.user,
                post:post,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
    })
    //文章编辑行为
    app.post('/edit/:name/:minute/:title',checkLogin);
    app.post('/edit/:name/:minute/:title',function(req,res){
        Post.update(req.params.name,req.params.minute,req.params.title,
            req.body.post,function(err){
                //encodeURI是防止有中文的情况下，对中文的字符进行转义
                var url = encodeURI('/u/'+ req.params.name + '/' + req.params.minute + '/' + req.params.title);
                if(err){
                    req.flash('error',err);
                    return res.redirect(url);
                }
                req.flash('success','编辑成功');
                return res.redirect(url);
        })
    })
    //文章删除行为
    app.get('/remove/:name/:minute/:title',checkLogin);
    app.get('/remove/:name/:minute/:title',function(req,res){
        Post.remove(req.params.name,req.params.minute,req.params.title,function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','修改成功');
            res.redirect('/');
        })
    })
    //文章存档
    app.get('/archive',function(req,res){
        Post.getArchive(function(err,posts){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('archive',{
                title:'存档',
                posts:posts,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
    })
}