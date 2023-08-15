const ws = require('ws');
const http = require('http');
const fs = require('fs');

try{
	fs.unlinkSync('/tmp/savox.sock');
}
catch(error){
	console.log(error);
};

let server = http.createServer();
let sockserver = new ws.WebSocketServer({ server : server });

server.listen('/tmp/savox.sock', e=>fs.chmodSync('/tmp/savox.sock', 666));

var utils = require("./utils.js");

/*
size: int64
variable name: char[]
data bytesize: int64
data: char[]
*/

sockserver.on('connection', (ws, req) => {
  clientInfo = utils.parseClientInfo(ws, req);

  ws.on('close', () => {});
  ws.on('message', (data) => onMessage(clientInfo));
  ws.onerror = function () { console.log('websocket error'); };
});

console.log("Server is active.");
