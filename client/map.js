let map;

function toggleMap(){

  let mapDiv = document.getElementById("map");

  // Close map
  if(mapDiv.style.display !== "none"){
    mapDiv.style.display = "none";
    cameras.style.display = "";
    document.getElementById("mapButtonIcon").classList.replace("mapButtonIcon2", "mapButtonIcon")
    document.getElementById("toggleSettings").style.display = "none";
    if(settings.className === "settings"){
      toggleSettings();
    }
    return;
  }

  // Close device panel to load map on whole screen
  if(devices.className === "devices"){
    devices.classList.replace("devices", "devices-minimized");
    togglePanelIcon.classList.replace("togglePanelIcon", "togglePanelIconClosed");
  }

  // Disable buttons during map load
  document.getElementById("togglePanel").setAttribute('disabled', '');
  document.getElementById("mapButton").setAttribute('disabled', '');
  
  loading.style.display = "flex";
  cameras.style.display = "none";

  setTimeout(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaWlyb2thcnBwYW5lbiIsImEiOiJjbGp5N2hjNnEwMjJrM2NwaDlqb2I1NzdtIn0.OCHoNmXCEDpJnu53S5SHYA';

    // Load map theme from localstorage or use default
    let mapTheme;
    localStorage.getItem("theme") ?
    mapTheme = localStorage.getItem("theme") :
    mapTheme = 'mapbox://styles/iirokarppanen/clkmn36ts001q01qx71oycubk' 
    
    // Initialize map
    map = new mapboxgl.Map({
      container: 'map', 
      style: mapTheme,
      center: [24.825637, 60.185934], 
      zoom: 14 
    });

    // Add markers to map
    for (const feature of geojson.features) {
      const el = document.createElement('div');
      el.className = 'marker';

      new mapboxgl.Marker(el).setLngLat(feature.geometry.coordinates).addTo(map);
      new mapboxgl.Marker(el)
      .setLngLat(feature.geometry.coordinates)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }) 
          .setHTML(
            `<h3>${feature.properties.title}</h3><p>${feature.properties.description}</p>`
          )
      )
      .addTo(map);
    }

    
    map.on('load', function() {        
      loading.style.display = "none";
      mapDiv.style.display = "";

      mapButtonIcon.classList.replace("mapButtonIcon", "mapButtonIcon2");

      document.getElementById("togglePanel").removeAttribute("disabled");
      document.getElementById("mapButton").removeAttribute("disabled");
      document.getElementById("toggleSettings").style.display = "block";

      map.resize();
      handleCheckBoxes();
    });

    // add buildings to map
    map.on('style.load', () => {
      const layers = map.getStyle().layers;
      const labelLayerId = layers.find(
      (layer) => layer.type === 'symbol' && layer.layout['text-field']
      ).id;
        
      map.addLayer(
      buildings
      ,
      labelLayerId
      );
    });
  }, 400)
}
  
// Map Settings
function toggleSettings(){
  handleCheckBoxes();
  settings.className === "settings-minimized" ? 
  settings.className = "settings" :
  settings.className = "settings-minimized"
}

function switchTheme(theme){
  map.setStyle(theme); 
  localStorage.setItem("theme", theme);

  // Reset settings on theme change
  localStorage.setItem("locationLabel", "visible")
  localStorage.setItem("streetLabel", "visible")
  localStorage.setItem("streetHighlight", "visible")
  handleCheckBoxes();
}

function toggleOption(type, checked){

  checked ? localStorage.setItem(type, "visible") : localStorage.setItem(type, "hidden");

  if(type === "locationLabel"){
    map.style.stylesheet.layers.forEach(function(layer) {
      if (layer.id.includes("label") & !layer.id.includes("road")) {
        map.setLayoutProperty(layer.id,"visibility", checked ?"visible":"none");
      }
    });
  }
  if(type === "streetLabel"){
    map.style.stylesheet.layers.forEach(function(layer) {
      if (layer.id.includes("label") & layer.id.includes("road")) {
          map.setLayoutProperty(layer.id,"visibility", checked?"visible":"none");
      }
    });
  }
  if(type === "streetHighlight"){
    map.style.stylesheet.layers.forEach(function(layer) {
      if (layer.type === "line" & (layer.id.includes("road") || layer.id.includes("tunnel") || layer.id.includes("bridge"))) {
          map.setLayoutProperty(layer.id,"visibility", checked?"visible":"none");
      }
    });
  }
  if(type === "buildings"){
    map.getStyle().layers.forEach(function(layer) {
      if (layer.id === "add-3d-buildings") {
        map.setLayoutProperty(layer.id,"visibility", checked?"visible":"none");
      }
    });
  }
}

function handleCheckBoxes(){

  const options = ["locationLabel", "streetLabel", "streetHighlight", "buildings"];

  for(let option of options) {

    let checkBox = document.getElementById(option);

    if(localStorage.getItem(option) !== null){
      localStorage.getItem(option) === "visible" 
      ? (checkBox.checked = true) 
      : (checkBox.checked = false)

      toggleOption(option, checkBox.checked);
    }
  }
}
  
const geojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [24.83333, 60.1833326]
      },
      properties: {
        title: 'Camera 1',
        description: 'Something here'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [24.819360, 60.187404]
      },
      properties: {
        title: 'Camera 2',
        description: 'Something here'
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [24.822597, 60.185702]
      },
      properties: {
        title: 'Camera 3',
        description: 'Something here'
      }
    }
  ]
};

const buildings = {
  'id': 'add-3d-buildings',
  'source': 'composite',
  'source-layer': 'building',
  'filter': ['==', 'extrude', 'true'],
  'type': 'fill-extrusion',
  'minzoom': 15,
  'paint': {
  'fill-extrusion-color': '#aaa',
   
  'fill-extrusion-height': [
  'interpolate',
  ['linear'],
  ['zoom'],
  15,
  0,
  15.05,
  ['get', 'height']
  ],
  'fill-extrusion-base': [
  'interpolate',
  ['linear'],
  ['zoom'],
  15,
  0,
  15.05,
  ['get', 'min_height']
  ],
  'fill-extrusion-opacity': 0.8
  }
  };

