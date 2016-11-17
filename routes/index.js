//登录和注册需要的User类
var User = require('../models/user');
//需要引入一个加密的模块
var crypto = require('crypto');

module.exports = function(app){
    //首页
    app.get('/',function(req,res){
        res.render('index',{
            title:'主页',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    //注册页面
    app.get('/reg',function(req,res){
        res.render('reg',{
            title:'注册',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    //注册行为
    app.post('/reg',function(req,res){
        //数据接收req.body
        console.log(req.body);
        //用户名
        var name = req.body.name;
        //密码
        var password = req.body.password;
        //确认密码
        var password_re = req.body['password-repeat'];
        //邮箱
        var email = req.body.email;
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
                req.flash('success','注册成功');
                res.redirect('/');
            })
        })
    })
    //登录
    app.get('/login',function(req,res){
        res.render('login',{title:'登录'})
    })
    //登录行为
    app.post('/login',function(req,res){

    })
    //发表
    app.get('/post',function(req,res){
        res.render('post',{title:'发表'})
    })
    //发表行为
    app.post('/post',function(req,res){

    })
    //退出
    app.get('/logout',function(req,res){

    })

}
