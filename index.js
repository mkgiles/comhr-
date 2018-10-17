const port = 3000
const fs = require('fs')
const express = require('express')
const cookieParser = require('cookie-parser');
const app = express()
const https = require('https').Server({key: fs.readFileSync('.env/host.key'), cert: fs.readFileSync('.env/host.cert')},app);
const db = require('./db.js')
const mongoose = require('mongoose')
const wsock = require('ws')
const ws = new wsock.Server({server: https})
const uuid = require('uuid/v4')
mongoose.connect(db, {useNewUrlParser: true})
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.get('/', (req,res) => res.send("Welcome to comhrá!"))
app.get('/chat', (req,res) => res.redirect('/chat/' + uuid()));
app.get('/chat/:id', (req,res)=>res.sendFile(__dirname + '/views/chat.html'))
app.put('/name', (req,res) => {res.cookie('username', req.body.name),res.send('done')})
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
let usernames = []
ws.on('connection', (sock,req) => {
	sock.username = req.headers['cookie'];
        sock.room = req.url.split('/')[2]
        sock.username = sock.username?sock.username.split(';').filter((str)=>str.startsWith("username=")):undefined
        sock.username = sock.username?sock.username[0].split('=')[1]:"Anonymous"
        sock.username = sock.username.replace("%20", " ");
        usernames[sock.room] = [];
        ws.bcroom(sock.room, JSON.stringify({type: "users"}));
	ws.bcroom(sock.room, JSON.stringify({type: "server", data: "Server: " + sock.username + " has connected"}));
	sock.on('close', () => {
                usernames[sock.room] = []
                ws.bcroom(sock.room, JSON.stringify({type:"users"}));
                ws.bcroom(sock.room, JSON.stringify({type: "server", data: "Server: " + sock.username + " has disconnected"}))
        });
	sock.on('message', (message) => {
                let msg = JSON.parse(message);
                switch(msg.type){
                        case "chat":
                                ws.bcroom(sock.room, JSON.stringify({type: "chat", data: sock.username + ": " + msg.data}))
                                break;
                        case "user":
                                usernames[sock.room].push(msg.data);
                                sock.username = msg.data
                                if(usernames[sock.room].length == ws.clients.size)
                                        ws.bcall(JSON.stringify({type: "userlist", data: usernames[sock.room]}))
                                break;
                        case "rename":
                                ws.bcroom(sock.room, JSON.stringify({type: "server", data: "Server: " + sock.username + " is now known as " + msg.data}))
                                sock.username = msg.data;
                                usernames[sock.room] = []
                                ws.bcroom(sock.room, JSON.stringify({type: "users"}));
                                break;
                        case "whisper":
                                ws.whisper(msg.user, JSON.stringify({type: "whisper", data: sock.username + ": " + msg.data}))
                                break;
                        default:
                                console.log(msg)
                }
        })
})
https.listen(port, ()=> console.log(`Server listening on port ${port}!`))
