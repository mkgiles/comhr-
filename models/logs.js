const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Message = require('./messages.js')
const logSchema = new Schema({ chat: String, messages: [Message] })
const Log = mongoose.model('Log', logSchema)

module.exports = Log
