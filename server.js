const fs = require('fs')
const db = require('./db.js')
const express = require('express')
const app = express()
const sslPath = process.env.SSLPATH
const https = require('https').Server({key: fs.readFileSync(sslPath + 'privkey.pem'), cert: fs.readFileSync(sslPath + 'fullchain.pem')},app);
const uuid = require('uuid/v4')
const users = require('./routes/user.js')
const session = require('express-session')
const passport = require('passport')
const pplocal = require('passport-local').Strategy;
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose')
const User = require('./models/users.js')
const Log = require('./models/logs.js')
mongoose.connect(db, {useNewUrlParser: true})
app.use(session({ secret: process.env.SECRET, resave: true, saveUninitialized: false, cookie: {secure: true}, store: new MongoStore({mongooseConnection: mongoose.connection, stringify : false})}));
app.use(passport.initialize())
app.use(passport.session())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
passport.use(new pplocal((username, password, done) => 
        User.findOne({name: username}, (err, user) => {
                if(err)
                        return done(err);
                if(!user)
                        return done(null, false);
                User.passcheck(username, password, (result)=>{
                        if(result)
                                return done(null, user);
                        else
                                return done(null, false);
                })
        })
));
passport.serializeUser(function(user, done) {
        done(null, user._id);
});

passport.deserializeUser(function(id, done) {
        User.findById(id, function (err, user) {
                done(err, user);
  });
}); 
const isAuth = (req,res,next) => {
        if(req.isAuthenticated())
                next();
        else
                res.redirect('/login');
}
app.get('/', (req,res) => {res.send("Welcome to comhrá!")})
app.get('/chat', isAuth,(req,res) => res.redirect('/chat/' + uuid()));
app.get('/chat/:id',isAuth,(req,res)=>res.sendFile(__dirname + '/views/chat.html'))
app.get('/chat/:id/log',isAuth, (req,res)=>Log.findOne({chat: req.params.id}).exec((e,r)=>res.send(r.messages)))
app.get('/login', (req,res) => res.send("You need to log in or register to use this service."));
app.put('/name', (req,res) => User.findByIdAndUpdate(req.user._id, {nickname: req.body.name}, {new: true}).exec((_,r)=>res.send(r)))
app.put('/updatePassword', passport.authenticate('local'), users.updatePass);
app.post('/register', users.register)
app.post('/login', passport.authenticate('local',{successRedirect: "/", failureRedirect:"/login"}))
app.delete('/logout', (req,res)=>{req.logout();res.redirect('/')})
app.delete('/deregister', users.deregister)
module.exports = https
