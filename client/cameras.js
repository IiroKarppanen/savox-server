"use strict";

const THERMAL_CAMERA = 0;
const HD_CAMERA = 1;

let availableDevices = [];
let selectedDevice = undefined;

function clearCameraFeeds(){
  hd_canvas.getContext("2d").clearRect(0, 0, hd_canvas.width, hd_canvas.height);
  thermal_canvas.getContext("2d").clearRect(0, 0, thermal_canvas.width, thermal_canvas.height);
}

function getCanvasElementFromType(type){
  if(type == THERMAL_CAMERA) return thermal_canvas;
  if(type == HD_CAMERA) return hd_canvas;
  return undefined;
}

function updateCameraFeed(data){
  // parse data from websocket
  var w = new DataView(data, 0, 4).getUint32(0, false);
  var h = new DataView(data, 4, 4).getUint32(0, false);
  var type = new DataView(data, 8, 1).getUint8(0);
  var imgdata = data.slice(9+256);
  var blob = new Blob([imgdata], {'type': 'image/jpeg'});
  var url = URL.createObjectURL(blob);
  const devName = String.fromCharCode.apply(null, new Uint8Array(data.slice(9, 9+256))).trimEnd();
  // determine which canvas to modify
  console.log(w, h, type, devName);
  var element = getCanvasElementFromType(type);

  if(element === undefined){
    return;
  }

  // update canvas data
  if(element.width != w) element.width = w;
  if(element.height != h) element.height = h;
  var ctx = element.getContext("2d");
  var img = new Image();
  img.onload = (event) => {
    URL.revokeObjectURL(event.target.src);
    ctx.drawImage(event.target, 0, 0);
  }
  img.src = url;
}

function cameraMenuButtonCallback(devName){
  // New device was selected, change camera feeds, etc
  console.log(devName, "was selected");

  // Show device feed if clicked in map view
  if(document.getElementById("map").className.includes("visible")){
    toggleMap();
    // requestCamerafeedFrom(devName) // ?? 
  }

  selectedDevice = devName;
  clearCameraFeeds();
}


function addToCameraMenu(devName){
  let newDeviceElement = document.createElement("li");
  newDeviceElement.textContent = devName;
  newDeviceElement.addEventListener('click', () => {
    cameraMenuButtonCallback(devName);
  });

  try {
    deviceList.appendChild(newDeviceElement);
    availableDevices.push(devName);
  } catch (error) {
    console.error(error);
  }
  
}

function handleDeviceData(devName, data){

  if(availableDevices.length != 0){
    hd_canvas.parentElement.style.display = "";
    thermal_canvas.parentElement.style.display = "";
    document.getElementById("no-signal").style.display = "none";
  }

  if(!availableDevices.includes(devName)){
    addToCameraMenu(devName);
  }

  if(selectedDevice === undefined){
    // console.log("selecting", devName);
    selectedDevice = devName;
  }

  if(devName === selectedDevice){
    updateCameraFeed(data);
  }
}

function connect(){
  let ws=new WebSocket("ws://localhost:8080/api/websockets");
  ws.binaryType = "arraybuffer";
 
  ws.addEventListener("open", (e) => {
    console.log("Connected to server.");
  });
  ws.addEventListener("close", (e) => {
    console.log("Disconnected from server, attempting to connect again in 1 second.");
    try{
      connect();
    }
    finally{
    }
  });

  ws.addEventListener("message", (e, req) => {
    const devName = String.fromCharCode.apply(null, new Uint8Array(e.data.slice(9, 9+256))).trimEnd();
    // console.log("Recieving data from", devName);
    
    handleDeviceData(devName, e.data);
  });
}

try{
  connect();
}
finally{
}

// On mobile device panel is not visible automatically
if(window.innerWidth < 800){
  devices.classList.add("devices-minimized");
  devices.classList.remove("devices");
}

function toggleSidePanel(){

  if(devices.className === "devices"){
    devices.classList.replace("devices", "devices-minimized");
    togglePanelIcon.classList.replace("togglePanelIcon", "togglePanelIconClosed");
  }
  else{
    devices.classList.replace("devices-minimized", "devices");
    togglePanelIcon.classList.replace("togglePanelIconClosed", "togglePanelIcon");
  }
}


function toggleFullScreen(type){

  thermal_canvas.parentElement.style.display = "none";
  hd_canvas.parentElement.style.display = "none";


  
  let canvas = document.getElementById(type);
  let container = document.getElementById(type).parentElement;

  // Enable fullscreen
  if(canvas.className === "camera-canvas"){
    container.style.display = "";
    container.classList.toggle("camera-container-fullscreen");
    canvas.classList.toggle("camera-canvas-fullscreen");
  }

  // Disable fullscreen
  else{
    canvas.classList.remove("camera-canvas-fullscreen");
    container.classList.remove("camera-container-fullscreen");
    thermal_canvas.parentElement.style.display = "";
    hd_canvas.parentElement.style.display = "";
  }
  

}


// Return from fullscreen or map mode with esc key
function handleEscapeKeyPress(e) {
  if(e.key === "Escape") {
      if(document.getElementById("map").style.display != "none"){
        toggleMap();
      }
      if(hd_canvas.className.includes("fullscreen")){
        toggleFullScreen("hd_canvas");
      }
      if(thermal_canvas.className.includes("fullscreen")){
        toggleFullScreen("thermal_canvas");
      }
  }
}

document.addEventListener("keydown", handleEscapeKeyPress);