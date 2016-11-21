//登录和注册需要的User类
var User = require('../models/user');
//发表需要的Post类
var Post = require('../models/post');
//需要引入一个加密的模块
var crypto = require('crypto');


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
        Post.get(null,function(err,posts){
            if(err){
                posts = [];
            }
            res.render('index',{
                title:'主页',
                user:req.session.user,
                //所有的文章
                posts:posts,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        });
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
    //退出
    app.get('/logout',function(req,res){
        //1.清除session
        //2.给用户提示
        //3.跳转到首页
        req.session.user = null;
        req.flash('success','成功退出');
        res.redirect('/');
    })
}
