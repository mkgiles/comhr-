const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')

const userSchema = new Schema({ name: String, pass: String, nickname: {type: String, default: "Anonymous"}})
const User = mongoose.model('User', userSchema)
User.passcheck = (username, pass, cb) => User.findOne({name: username}, (err, user)=>
        bcrypt.compare(pass, user.pass, (err, res)=>{
                if(err){
                        console.log(err)
                        cb(false)
                }
                else
                        cb(res)
        }))
User.newPass = (pass) => {return new Promise((resolve, reject) => bcrypt.hash(pass, 10, (err, hash) => {if (err) reject(err); else resolve(hash)}));}

module.exports = User
