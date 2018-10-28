const mongoose = require('mongoose')
const Schema = mongoose.Schema
const User = require('./users.js').schema
const MessageSchema = new Schema({user: User, timestamp: Date, type: {type: String, enum: ['chat', 'user', 'rename', 'whisper']}, data: String}, {_id: false});
module.exports = MessageSchema
