const ws = require('ws');
const http = require('http');
const fs = require('fs');

function checkTokenValidity(api_token){
  return api_token == "secret_token 321";
}

try{
	fs.unlinkSync('/tmp/savox.sock');
}
catch(error){
	console.log(error);
};

let server = http.createServer();
let sockserver = new ws.WebSocketServer({ server : server });

server.listen('/tmp/savox.sock', e=>fs.chmodSync('/tmp/savox.sock', 666));

function parseClientInfo(ws, req){
  let clientInfo = {
    "allowedToStream": false,
    "deviceName": undefined,
    "isClient": false,
    "isDevice": false,
    "url": req.url
  };

  if(req.headers["api-token"] === undefined){
    clientInfo["isClient"] = true;
    clientInfo["isDevice"] = false;
    clientInfo["allowedToStream"] = false;

    console.log(`[CLIENT CONNECT]\tNew client connected from ${req.url}`);
  }
  else{
    const api_token = req.headers["api-token"];

    console.log(`[DEVICE CONNECT]\tA device has connected with an api token: "${api_token}". Checking validity...`);
    if(checkTokenValidity(api_token)){
      clientInfo["allowedToStream"] = true;
      clientInfo["deviceName"] = req.headers["device-name"];
      clientInfo["isDevice"] = true;
      clientInfo["isClient"] = false;
      console.log(`[DEVICE AUTHENTICATION]\tToken is valid. Device "${clientInfo["deviceName"]}" is allowed to stream.`);
    }
    else{
      clientInfo["allowedToStream"] = false;
      clientInfo["isDevice"] = false;
      clientInfo["isClient"] = false;
      console.log("[DEVICE AUTHENTICATION]\tToken is not valid. Disconnecting websocket to device");
      ws.close();
    }
  }

  return clientInfo;
}

function onClose(clientInfo){
  if(clientInfo["isDevice"] && clientInfo["allowedToStream"]){
    console.log(`[DEVICE CLOSE]\tDevice "${clientInfo["deviceName"]}" has disconnected.`);
  }
  if(clientInfo["isDevice"] && !clientInfo["allowedToStream"]){
    console.log(`[DEVICE CLOSE]\tUnauthorized device "${clientInfo["deviceName"]}" has been disconnected.`);
  }
  if(clientInfo["isClient"]){
    console.log(`[CLIENT CLOSE]\tClient has disconnected from ${clientInfo["url"]}`);
  }
}

function onMessage(clientInfo, data) {
  if(!clientInfo["allowedToStream"]){
    console.log("Preventing unauthorized device from sending data.");
    return;
  }

  sockserver.clients.forEach(client => {
    client.send(data);
  });
}

sockserver.on('connection', (ws, req) => {
  clientInfo = parseClientInfo(ws, req);
  
  ws.on('close', () => onClose(clientInfo));
  ws.on('message', (data) => onMessage(clientInfo, data));
  ws.onerror = function () { console.log('websocket error'); };
});

console.log("Server is active.");
