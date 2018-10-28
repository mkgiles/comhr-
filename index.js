const https = require('./server.js')
const ws = require('./ws.js')
const http = require('http').createServer((req,res)=>{res.writeHead(307, "HTTPS REDIRECT", {'Location': 'https://' + req.headers.host + req.url}); res.end()});
https.listen(443, ()=> console.log(`Secure server listening`))
http.listen(80)
