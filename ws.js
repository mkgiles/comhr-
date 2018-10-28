const wsock = require('ws')
const ws = new wsock.Server({server: require('./server.js')})
const mongoose = require('mongoose')
const Session = mongoose.model('Session',{_id: String, session: {cookie : Object, passport: { user: mongoose.Schema.Types.ObjectId }}})
const User = require('./models/users.js')
const Log = require('./models/logs.js')
ws.bcall = (data) => {
  ws.clients.forEach((client) => {
    if (client.readyState == wsock.OPEN) {
      client.send(data);
    }
  });
};
ws.bc = (sock, data) => {
        ws.clients.forEach((client) => {
                if(client != sock && client.readyState == wsock.OPEN) {
                        client.send(data);
                }
        });
}
ws.bcroom = (room, data) => {
        ws.clients.forEach((client) => {if(client.room == room && client.readyState == wsock.OPEN) client.send(data)})
}
ws.whisper = (username, data) => {
        ws.clients.forEach((client) => {if(client.username == username && client.readyState == wsock.OPEN) client.send(data)})
}
ws.users = (room,cb) => {const users = [];ws.clients.forEach((client) => {if(client.room == room && client.readyState == wsock.OPEN) users.push(client.username)}); return users}

ws.on('connection', (sock,req) => {
        sock.log = {messages:[]}
        sock.room = req.url.split('/')[2]
        Session.findById(req.headers['cookie'].split(';')[0].split('=s%3A')[1].split('.')[0]).exec((e,x)=>User.findById(x.session.passport.user).exec((e,user)=>{sock.user = user;sock.username = sock.user.nickname;ws.bcroom(sock.room, JSON.stringify({type: "server", data: "Server: " + sock.username + " has connected"}));ws.bcroom(sock.room,JSON.stringify({type: "userlist", data: ws.users(sock.room)}))}))
        Log.findOne({chat: sock.room}, (err, res)=>{if(!res) Log.create({chat: sock.room, messages: []}, (e, r) => sock.log = r);else sock.log=res});
	sock.on('close', () => {
                ws.bcroom(sock.room, JSON.stringify({type: "server", data: "Server: " + sock.username + " has disconnected"}))
                sock.log.save()
        });
	sock.on('message', (message) => {
                let msg = JSON.parse(message);
                msg.user = {_id: sock.user._id, nickname: sock.username}
                msg.timestamp = Date.now();
                sock.log.messages.push(msg);
                switch(msg.type){
                        case "chat":
                                ws.bcroom(sock.room, JSON.stringify({type: "chat", data: sock.username + ": " + msg.data}))
                                break;
                        case "rename":
                                ws.bcroom(sock.room, JSON.stringify({type: "server", data: "Server: " + sock.username + " is now known as " + msg.data}))
                                sock.username = msg.data;
                                ws.bcroom(sock.room, JSON.stringify({type: "userlist", data: ws.users(sock.room)}));
                                break;
                        case "whisper":
                                ws.whisper(msg.tgt, JSON.stringify({type: "whisper", data: sock.username + ": " + msg.data}))
                                break;
                        default:
                                console.log(msg)
                }
        })
})
module.exports = ws
