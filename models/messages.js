const mongoose = require('mongoose')
const Schema = mongoose.Schema
const User = require('./users.js').schema
const MessageSchema = new Schema({user: User, timestamp: Date, tgt: String, type: {type: String, enum: ['rename', 'chat', 'whisper']}, data: String}, {_id: false});
module.exports = MessageSchema
