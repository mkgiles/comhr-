const User = require('../models/users')
const express = require('express')
const router = express.Router()
const passport = require('passport')
router.updatePass = (req,res) => User.newPass(req.body.newpassword)
        .then((hash) => User.findByIdAndUpdate(req.user._id, {pass: hash}))
        .then(res.redirect('/'));

router.register = (req,res) => User.newPass(req.body.password)
                .then((hash) =>User.create({name: req.body.username, pass: hash}))
                .then((user) =>req.login(user, ()=>{return res.redirect('/')}));
router.deregister = (req,res) => {if(req.isAuthenticated()){User.findByIdAndDelete(req.user._id).exec(()=>{req.logout();res.redirect('/')})}else res.redirect('/login')}

module.exports = router;
