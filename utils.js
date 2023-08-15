module.exports = {
  checkTokenValidity: function(token){
    return token == "secret_token 321";
  },

  parseClientInfo: function(ws, req){
    /*
    api-token
    type: device/app/client
    deviceName
    */
    var clientInfo = {
      "type": "",
      // "group": "",
      "name": "",
      // "id": "",
      "url": "",
      // "api-token": "",
      "allowedToUpload": false,
      "allowedToListen": false,
      // "": false
    };

    let url = req.url;
    let name = req.headers["name"];
    let token = req.headers["api-token"];
    let type = req.headers["type"];

    clientInfo.url = url;
    
    // determine type of connection
    switch(type){
      case "device": clientInfo.type = "device"; break;
      case "web": clientInfo.type = "web"; break;
      case "app": clientInfo.type = "app"; break;
      default:
        clientInfo.type = "unrecognized";
        break;
    }

    // apply name
    if(type == "device"){
      clientInfo.name = (name === undefined ? "nameless device" : name);
    }
    else{
      clientInfo.name = "-";
    }

    // give permissions
    clientInfo.allowedToListen = true; // in case there is accounts, add here (?)

    if(type == "device"){
      if(this.checkTokenValidity(api_token)){
        clientInfo.allowedToUpload = true;
      }
    }

    return clientInfo;
  }
}